jest.mock('expo-file-system', () => {
  type MockNode =
    | { kind: 'directory'; children: string[] }
    | { kind: 'file'; size: number | null };

  const nodes = new Map<string, MockNode>();
  const deletedUris: string[] = [];
  const failingDeletes = new Set<string>();

  class Directory {
    uri: string;

    constructor(base: string | { uri: string }, name?: string) {
      const baseUri = typeof base === 'string' ? base : base.uri;
      this.uri = name ? `${baseUri.replace(/\/?$/, '/')}${name}/` : baseUri;
    }

    get exists() {
      return nodes.get(this.uri)?.kind === 'directory';
    }

    list() {
      const node = nodes.get(this.uri);
      if (node?.kind !== 'directory') {
        throw new Error(`Directory does not exist: ${this.uri}`);
      }
      return node.children.map(childUri =>
        nodes.get(childUri)?.kind === 'directory'
          ? new Directory(childUri)
          : new File(childUri),
      );
    }
  }

  class File {
    uri: string;

    constructor(uri: string) {
      this.uri = uri;
    }

    get size() {
      const node = nodes.get(this.uri);
      return node?.kind === 'file' ? node.size : null;
    }

    delete() {
      if (failingDeletes.has(this.uri)) {
        throw new Error(`Cannot delete: ${this.uri}`);
      }
      nodes.delete(this.uri);
      deletedUris.push(this.uri);
    }
  }

  return {
    Directory,
    File,
    Paths: {
      cache: 'file:///cache/',
    },
    __mockFileSystem: {
      addDirectory: (uri: string, children: string[]) => {
        nodes.set(uri, { kind: 'directory', children });
      },
      addFile: (uri: string, size: number | null) => {
        nodes.set(uri, { kind: 'file', size });
      },
      failDeleteOf: (uri: string) => {
        failingDeletes.add(uri);
      },
      deletedUris: () => [...deletedUris],
      exists: (uri: string) => nodes.has(uri),
      reset: () => {
        nodes.clear();
        deletedUris.length = 0;
        failingDeletes.clear();
      },
    },
  };
});

import { sweepOversizedSentryEnvelopes } from '@app/lib/sentryCacheSweep';

const fileSystemMock = jest.requireMock('expo-file-system')
  .__mockFileSystem as {
  addDirectory: (uri: string, children: string[]) => void;
  addFile: (uri: string, size: number | null) => void;
  failDeleteOf: (uri: string) => void;
  deletedUris: () => string[];
  exists: (uri: string) => boolean;
  reset: () => void;
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

    sweepOversizedSentryEnvelopes();

    expect(fileSystemMock.deletedUris()).toEqual([`${ENVELOPES_DIR}wedged`]);
    expect(fileSystemMock.exists(`${ENVELOPES_DIR}crash-report`)).toBe(true);
    expect(fileSystemMock.exists(`${ENVELOPES_DIR}exactly-limit`)).toBe(true);
  });

  test('treats an unknown file size as small instead of deleting', () => {
    seedIosEnvelopes({
      [`${ENVELOPES_DIR}unknown-size`]: null,
    });

    sweepOversizedSentryEnvelopes();

    expect(fileSystemMock.deletedUris()).toEqual([]);
  });

  test('does nothing when no sentry cache directory exists', () => {
    expect(() => sweepOversizedSentryEnvelopes()).not.toThrow();
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

    sweepOversizedSentryEnvelopes();

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

    sweepOversizedSentryEnvelopes();

    expect(fileSystemMock.deletedUris()).toEqual([`${ENVELOPES_DIR}wedged`]);
  });
});
