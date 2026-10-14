import * as SentryReactNative from '@sentry/react-native';

import * as SentryImageSpans from '@app/lib/sentry-image-spans';

import { forwardLogToSentry } from '../sentry';

/**
 * The root Sentry mock has no Scope, and faking one means inventing ~46
 * fields; requireActual reaches past it for the real pure-JS Scope class.
 */
const { Scope } = jest.requireActual<typeof SentryReactNative>(
  '@sentry/react-native',
);

let scope = new Scope();

jest
  .spyOn(SentryImageSpans, 'instrumentExpoImageLoads')
  .mockImplementation(() => undefined);

/**
 * Reached through the root manual mock: no-restricted-imports bans
 * @sentry/react-native outside src/lib/sentry.
 */
const mockCaptureException = jest.mocked(SentryReactNative.captureException);

const mockCaptureMessage = jest.mocked(SentryReactNative.captureMessage);
const mockLoggerWarn = jest.mocked(SentryReactNative.logger.warn);
const mockWithScope = jest.mocked(SentryReactNative.withScope);

beforeEach(() => {
  jest.clearAllMocks();
  scope = new Scope();
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

    const exception = mockCaptureException.mock.calls[0]?.[0];

    expect(exception).toBeInstanceOf(Error);
    expect(String(exception)).toBe('chat_resources_error: boom');

    expect(scope.getScopeData().tags).toEqual({
      log_category: 'chat',
      error_type: 'chat_resources_error',
    });
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

    expect(scope.getScopeData().tags).toEqual({
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

    expect(scope.getScopeData().tags).toEqual({
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

    expect(scope.getScopeData().tags).toEqual({
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

    expect(scope.getScopeData().tags).toEqual({
      log_category: 'chat',
      kept: 1,
    });
  });
});
