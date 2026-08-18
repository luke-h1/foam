import * as SentryReactNative from '@sentry/react-native';

import * as SentryImageSpans from '@app/lib/sentryImageSpans';

import { forwardLogToSentry, type LogTagValue } from '../sentry';

/**
 * `@sentry/react-native` is auto-mocked from the root `__mocks__/` file,
 * whose Scope-free surface only covers the functions this codebase actually
 * imports - so a fake Scope object would need to invent all ~46 of its real
 * fields. `requireActual` reaches past the mock for the real, pure-JS Scope
 * class instead, giving `applyLogScope` (src/lib/sentry.ts) a genuine
 * instance to call setTag/setFingerprint/setContext on.
 */
const { Scope } = jest.requireActual<typeof SentryReactNative>(
  '@sentry/react-native',
);
const scope = new Scope();
const setTagSpy = jest.spyOn(scope, 'setTag');
jest.spyOn(scope, 'setFingerprint');
jest.spyOn(scope, 'setContext');

jest
  .spyOn(SentryImageSpans, 'instrumentExpoImageLoads')
  .mockImplementation(() => undefined);

/**
 * Reached through the root `__mocks__/@sentry/react-native.ts` manual mock
 * rather than an import alias: `no-restricted-imports` bans
 * `@sentry/react-native` outside `src/lib/sentry`, and the transport under
 * test is the very thing that boundary exists to funnel through.
 */
const mockCaptureException = jest.mocked(SentryReactNative.captureException);
const mockCaptureMessage = jest.mocked(SentryReactNative.captureMessage);
const mockLoggerWarn = jest.mocked(SentryReactNative.logger.warn);
const mockWithScope = jest.mocked(SentryReactNative.withScope);

/**
 * The tags a scope ended up with, in the order they were written - `setTag`
 * is last-write-wins, so order is the contract under test.
 */
function appliedTags(): Record<string, NonNullable<LogTagValue>> {
  return Object.fromEntries(
    setTagSpy.mock.calls.map(([key, value]) => {
      // SAFETY: applyLogScope (src/lib/sentry.ts) skips null/undefined tag
      // values before calling setTag and never passes a bigint or symbol, so
      // every recorded value is a LogTagValue even though Scope's own
      // setTag signature accepts the wider Sentry `Primitive` type.
      return [key, value as NonNullable<LogTagValue>] as const;
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWithScope.mockImplementation(callback => callback(scope));
});

describe('forwardLogToSentry warn', () => {
  test('stays a structured log rather than an issue that can page on-call', () => {
    forwardLogToSentry({
      level: 'warn',
      category: 'chat',
      message: 'chat.emote.load_failed',
      metadata: { name: 'chat_resources_warning', url: 'https://cdn/1.webp' },
    });

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'chat_resources_warning: chat.emote.load_failed',
      { url: 'https://cdn/1.webp' },
    );
    expect(mockCaptureMessage).not.toHaveBeenCalled();
    expect(mockWithScope).not.toHaveBeenCalled();
  });
});

describe('forwardLogToSentry error', () => {
  test('captures an exception', () => {
    forwardLogToSentry({
      level: 'error',
      category: 'chat',
      message: 'boom',
      metadata: { name: 'chat_resources_error' },
    });

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
  });

  test('caller tags cannot clobber the canonical grouping tags', () => {
    forwardLogToSentry({
      level: 'error',
      category: 'chat',
      message: 'boom',
      metadata: {
        name: 'chat_resources_error',
        tags: { log_category: 'spoofed', error_type: 'spoofed', ok: 'kept' },
      },
    });

    expect(appliedTags()).toEqual({
      log_category: 'chat',
      error_type: 'chat_resources_error',
      ok: 'kept',
    });
  });

  test('keeps the first 24 caller tags and drops the rest', () => {
    const tags = Object.fromEntries(
      Array.from({ length: 30 }, (_, index) => [`t${index}`, 'v']),
    );
    forwardLogToSentry({
      level: 'error',
      category: 'chat',
      message: 'boom',
      metadata: { tags },
    });

    expect(appliedTags()).toEqual({
      ...Object.fromEntries(
        Array.from({ length: 24 }, (_, index) => [`t${index}`, 'v']),
      ),
      log_category: 'chat',
    });
  });

  test('truncates a tag value at the length Sentry itself accepts', () => {
    forwardLogToSentry({
      level: 'error',
      category: 'chat',
      message: 'boom',
      metadata: { tags: { long: 'x'.repeat(500) } },
    });

    expect(appliedTags()).toEqual({
      log_category: 'chat',
      long: 'x'.repeat(200),
    });
  });

  test('skips a null or undefined tag value', () => {
    forwardLogToSentry({
      level: 'error',
      category: 'chat',
      message: 'boom',
      metadata: { tags: { absent: undefined, empty: null, kept: 1 } },
    });

    expect(appliedTags()).toEqual({ log_category: 'chat', kept: 1 });
  });
});
