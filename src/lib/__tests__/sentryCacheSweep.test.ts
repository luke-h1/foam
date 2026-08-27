import { sweepOversizedSentryEnvelopesNow } from '@app/lib/sentryCacheSweep';

/**
 * require, not a static import: __mockFileSystem only exists on the manual
 * mock, and jest.requireMock resolves a separate module instance.
 */
// SAFETY: __mocks__/expo-file-system.ts defines __mockFileSystem with exactly this shape.
const { __mockFileSystem: fileSystemMock } = require('expo-file-system') as {
  __mockFileSystem: {
    addDirectory: (uri: string, children: string[]) => void;
    addFile: (uri: string, size: number | null) => void;
    failDeleteOf: (uri: string) => void;
    deletedUris: () => string[];
    exists: (uri: string) => boolean;
    reset: () => void;
  };
};

const ENVELOPES_DIR = 'file:///cache/io.sentry/abc123/envelopes/';

function seedIosEnvelopes(files: Record<string, number | null>) {
  const fileUris = Object.keys(files);
  fileSystemMock.addDirectory('file:///cache/io.sentry/', [
    'file:///cache/io.sentry/abc123/',
  ]);
  fileSystemMock.addDirectory('file:///cache/io.sentry/abc123/', [
    ENVELOPES_DIR,
  ]);
  fileSystemMock.addDirectory(ENVELOPES_DIR, fileUris);
  for (const uri of fileUris) {
    fileSystemMock.addFile(uri, files[uri] ?? null);
  }
}

describe('sweepOversizedSentryEnvelopes', () => {
  beforeEach(() => {
    fileSystemMock.reset();
  });

  test('deletes cached envelopes over the size limit and keeps the rest', () => {
    seedIosEnvelopes({
      [`${ENVELOPES_DIR}wedged`]: 80_317_913,
      [`${ENVELOPES_DIR}crash-report`]: 300_000,
      [`${ENVELOPES_DIR}exactly-limit`]: 8 * 1024 * 1024,
    });

    sweepOversizedSentryEnvelopesNow();

    expect(fileSystemMock.deletedUris()).toEqual([`${ENVELOPES_DIR}wedged`]);
    expect(fileSystemMock.exists(`${ENVELOPES_DIR}crash-report`)).toBe(true);
    expect(fileSystemMock.exists(`${ENVELOPES_DIR}exactly-limit`)).toBe(true);
  });

  test('treats an unknown file size as small instead of deleting', () => {
    seedIosEnvelopes({
      [`${ENVELOPES_DIR}unknown-size`]: null,
    });

    sweepOversizedSentryEnvelopesNow();

    expect(fileSystemMock.deletedUris()).toEqual([]);
  });

  test('does nothing when no sentry cache directory exists', () => {
    sweepOversizedSentryEnvelopesNow();

    expect(fileSystemMock.deletedUris()).toEqual([]);
  });

  test('sweeps the android sentry cache directory as well', () => {
    fileSystemMock.addDirectory('file:///cache/sentry/', [
      'file:///cache/sentry/outbox/',
    ]);
    fileSystemMock.addDirectory('file:///cache/sentry/outbox/', [
      'file:///cache/sentry/outbox/huge.envelope',
    ]);
    fileSystemMock.addFile(
      'file:///cache/sentry/outbox/huge.envelope',
      50_000_000,
    );

    sweepOversizedSentryEnvelopesNow();

    expect(fileSystemMock.deletedUris()).toEqual([
      'file:///cache/sentry/outbox/huge.envelope',
    ]);
  });

  test('keeps sweeping when a single delete fails', () => {
    seedIosEnvelopes({
      [`${ENVELOPES_DIR}undeletable`]: 20_000_000,
      [`${ENVELOPES_DIR}wedged`]: 80_317_913,
    });
    fileSystemMock.failDeleteOf(`${ENVELOPES_DIR}undeletable`);

    sweepOversizedSentryEnvelopesNow();

    expect(fileSystemMock.deletedUris()).toEqual([`${ENVELOPES_DIR}wedged`]);
  });
});
