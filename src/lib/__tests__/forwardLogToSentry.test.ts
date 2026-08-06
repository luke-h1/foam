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
  test('captures a message rather than a structured log', () => {
    forwardLogToSentry({
      level: 'warn',
      category: 'chat',
      message: 'chat.emote.load_failed',
      metadata: { name: 'chat_resources_warning' },
    });

    expect(sentry.captureMessage).toHaveBeenCalledWith(
      'chat_resources_warning: chat.emote.load_failed',
      'warning',
    );
    expect(sentry.logger.warn).not.toHaveBeenCalled();
  });

  test('caller tags cannot clobber the canonical grouping tags', () => {
    forwardLogToSentry({
      level: 'warn',
      category: 'chat',
      message: 'boom',
      metadata: {
        name: 'chat_resources_warning',
        tags: { log_category: 'spoofed', error_type: 'spoofed', ok: 'kept' },
      },
    });

    expect(appliedTags()).toEqual({
      log_category: 'chat',
      error_type: 'chat_resources_warning',
      ok: 'kept',
    });
  });

  test('drops tags past the cap and truncates an oversized value', () => {
    const tags = Object.fromEntries(
      Array.from({ length: 30 }, (_, index) => [`t${index}`, 'v']),
    );
    forwardLogToSentry({
      level: 'warn',
      category: 'chat',
      message: 'boom',
      metadata: { tags: { ...tags, long: 'x'.repeat(500) } },
    });

    const applied = appliedTags();
    // 24 caller tags plus log_category; `long` fell outside the cap.
    expect(Object.keys(applied)).toHaveLength(25);
    expect(applied.long).toBeUndefined();

    jest.clearAllMocks();
    forwardLogToSentry({
      level: 'warn',
      category: 'chat',
      message: 'boom',
      metadata: { tags: { long: 'x'.repeat(500) } },
    });

    expect(appliedTags().long).toEqual('x'.repeat(200));
  });

  test('skips a null or undefined tag value', () => {
    forwardLogToSentry({
      level: 'warn',
      category: 'chat',
      message: 'boom',
      metadata: { tags: { absent: undefined, empty: null, kept: 1 } },
    });

    expect(appliedTags()).toEqual({ log_category: 'chat', kept: 1 });
  });
});

describe('forwardLogToSentry error', () => {
  test('applies the same tag precedence as warn', () => {
    forwardLogToSentry({
      level: 'error',
      category: 'chat',
      message: 'boom',
      metadata: {
        name: 'chat_resources_error',
        tags: { log_category: 'spoofed' },
      },
    });

    expect(appliedTags()).toEqual({
      log_category: 'chat',
      error_type: 'chat_resources_error',
    });
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
