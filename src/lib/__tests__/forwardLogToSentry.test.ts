import { forwardLogToSentry } from '../sentry';

const scope = {
  setTag: jest.fn(),
  setFingerprint: jest.fn(),
  setContext: jest.fn(),
};

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  expoRouterIntegration: jest.fn(() => ({})),
  logger: { info: jest.fn(), warn: jest.fn() },
  withScope: jest.fn(),
}));

jest.mock('@app/lib/sentryImageSpans', () => ({
  instrumentExpoImageLoads: jest.fn(),
}));

/**
 * Reached through the mock registry rather than an import: `no-restricted-imports`
 * bans `@sentry/react-native` outside `src/lib/sentry`, and the transport under
 * test is the very thing that boundary exists to funnel through.
 */
const sentry = jest.requireMock('@sentry/react-native') as {
  captureException: jest.Mock;
  captureMessage: jest.Mock;
  logger: { warn: jest.Mock };
  withScope: jest.Mock;
};

/**
 * The tags a scope ended up with, in the order they were written - `setTag`
 * is last-write-wins, so order is the contract under test.
 */
function appliedTags(): Record<string, unknown> {
  return Object.fromEntries(
    scope.setTag.mock.calls.map(([key, value]) => [key, value]),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  sentry.withScope.mockImplementation(callback => callback(scope));
});

describe('forwardLogToSentry warn', () => {
  test('stays a structured log rather than an issue that can page on-call', () => {
    forwardLogToSentry({
      level: 'warn',
      category: 'chat',
      message: 'chat.emote.load_failed',
      metadata: { name: 'chat_resources_warning', url: 'https://cdn/1.webp' },
    });

    expect(sentry.logger.warn).toHaveBeenCalledWith(
      'chat_resources_warning: chat.emote.load_failed',
      { url: 'https://cdn/1.webp' },
    );
    expect(sentry.captureMessage).not.toHaveBeenCalled();
    expect(sentry.withScope).not.toHaveBeenCalled();
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

    expect(sentry.captureException).toHaveBeenCalledTimes(1);
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
