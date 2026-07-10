/**
 * Guards the bun patch on @sentry/core that mirrors
 * getsentry/sentry-javascript#21959 (sentry-react-native#6420): if the console
 * instrumentation runs twice against the same module state, the second pass
 * stores the first wrapper as the "original" console method, and every console
 * call then re-enters the wrapper until RangeError: Maximum call stack size
 * exceeded aborts the app. The patch makes instrumentConsole idempotent per
 * level. If a dependency bump drops the patch, this test fails.
 */
const consoleInstrumentation =
  require('../node_modules/@sentry/core/build/cjs/instrument/console.js') as {
    instrumentConsole: (() => void) | undefined;
  };
const debugLogger =
  require('../node_modules/@sentry/core/build/cjs/utils/debug-logger.js') as {
    originalConsoleMethods: Partial<
      Record<string, (...args: unknown[]) => void>
    >;
  };

const nativeConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  log: console.log,
  assert: console.assert,
  trace: console.trace,
};

afterAll(() => {
  Object.assign(console, nativeConsole);
});

describe('@sentry/core console instrumentation patch', () => {
  test('exposes instrumentConsole so the patch can be exercised', () => {
    expect(typeof consoleInstrumentation.instrumentConsole).toBe('function');
  });

  test('instrumenting twice keeps the native method as the original and does not recurse', () => {
    consoleInstrumentation.instrumentConsole?.();
    consoleInstrumentation.instrumentConsole?.();

    // Unpatched, the second pass stores the first wrapper here instead of the
    // native method, which is the recursion cycle.
    expect(debugLogger.originalConsoleMethods.debug).toBe(nativeConsole.debug);

    // Unpatched, this throws RangeError: Maximum call stack size exceeded.
    expect(() => {
      console.debug('[sentryCoreConsolePatch] recursion probe');
    }).not.toThrow();
  });
});
