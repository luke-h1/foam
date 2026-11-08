/* oxlint-disable @typescript-eslint/no-explicit-any -- the Skia, react-native and react mocks below have no static types */

import '@testing-library/jest-native/extend-expect';
import 'react-native-url-polyfill/auto';
import 'cross-fetch/polyfill';

import type { ReactNode, Ref } from 'react';

import type { SkData } from '@shopify/react-native-skia';
import { TextDecoder, TextEncoder } from 'node:util';
import { configure as configureReassure } from 'reassure';

import mockFile from '../__mocks__/mockFile';

// SAFETY: Node's util.TextEncoder implements the DOM TextEncoder surface the app code encodes with.
global.TextEncoder = TextEncoder as typeof global.TextEncoder;

// SAFETY: Node's util.TextDecoder implements the DOM TextDecoder surface the app code decodes with.
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

if (globalThis.CloseEvent === undefined) {
  globalThis.CloseEvent = class CloseEvent extends Event {
    code: number;
    reason: string;
    wasClean: boolean;

    constructor(type: string, eventInitDict?: CloseEventInit) {
      super(type, eventInitDict);
      this.code = eventInitDict?.code ?? 0;
      this.reason = eventInitDict?.reason ?? '';
      this.wasClean = eventInitDict?.wasClean ?? false;
    }
  };
}

configureReassure({ testingLibrary: 'react-native' });

/**
 * The Skia jest mock renders components as plain Views but routes imperative
 * calls (Skia.Path.Make etc.) to global.CanvasKit, which is never loaded in
 * the Jest environment. Tests draw nothing, so a call-through proxy is enough.
 */
function canvasKitStub(): any {
  return new Proxy(() => {}, {
    get: (_target, prop) =>
      prop === Symbol.toPrimitive ? () => 0 : canvasKitStub(),
    construct: () => canvasKitStub(),
    apply: () => canvasKitStub(),
  });
}

// SAFETY: the Skia jest mock reads global.CanvasKit, which no global type declares.
(global as any).CanvasKit = canvasKitStub();

/**
 * Package jestSetup's Mock omits `useAnimatedImageValue`; tiled/stretch paint
 * overlays need it so animated URL layers don't throw in unit tests.
 */
{
  // SAFETY: the assertion types only the mock export this patch reads and adds.
  const skia = require('@shopify/react-native-skia') as {
    useAnimatedImageValue?: () => { value?: unknown };
  };

  if (skia.useAnimatedImageValue === undefined) {
    skia.useAnimatedImageValue = () => ({});
  }
}

/**
 * Sentry calls setImmediate, which the Node test environment may not provide.
 */
global.setImmediate =
  global.setImmediate ||
  ((callback: (...args: any[]) => void, ...args: any) =>
    setTimeout(callback, 0, ...args));

const createReactNativeHostMock = (hostName: string) =>
  // SAFETY: require('react') has no static type here; forwardRef is a real function on the real module.
  (require('react').forwardRef as any)(
    ({ children, ...props }: { children?: ReactNode }, ref: Ref<unknown>) =>
      require('react').createElement(
        hostName,
        ref == null ? props : { ...props, ref },
        children,
      ),
  );

/**
 * A handful of react-native exports are swapped for lightweight host mocks
 * (FlatList/ScrollView/Text/TextInput render their intrinsic tag directly,
 * Image and Share drop native calls) - everything else on the module keeps
 * its real implementation. This has to patch the real module object in
 * place (rather than a root __mocks__/react-native.js) so every other
 * module's require('react-native') - including
 * @testing-library/react-native's own host-component-name checks - resolves
 * the same patched object. Plain require, not `import * as`, matters here
 * too: a namespace import gets Babel's interop copy, and mutating that copy
 * is invisible to every other module's own require of 'react-native'.
 */
{
  const ReactNative = require('react-native');

  const mockNativeView = createReactNativeHostMock('View');

  const overrides = {
    FlatList: mockNativeView,
    Share: { share: jest.fn() },
    ScrollView: mockNativeView,
    Text: createReactNativeHostMock('Text'),
    TextInput: createReactNativeHostMock('TextInput'),
    Image: {
      resolveAssetSource: jest.fn(_source => mockFile),
      getSize: jest.fn(
        (
          _uri: string,
          success: (width: number, height: number) => void,
          _failure?: (_error: any) => void,
        ) => success(100, 100),
      ),
    },
  };

  Object.entries(overrides).forEach(([key, value]) => {
    Object.defineProperty(ReactNative, key, {
      configurable: true,
      enumerable: true,
      value,
    });
  });
}

/**
 * The Skia jest mock delegates Data.fromURI to the web CanvasKit API, which
 * performs a real fetch - in tests that means a live network socket per
 * texture URL, and a single-file jest run (which executes in-band) never
 * exits while one is pending. Resolve to null instead: consumers already
 * treat a null image as "texture unavailable".
 */
// SAFETY: the assertion types only the mock's Skia.Data.fromURI slot this patch replaces.
const skiaMock = require('@shopify/react-native-skia') as {
  Skia?: { Data?: { fromURI?: (uri: string) => Promise<SkData | null> } };
};

if (skiaMock.Skia?.Data) {
  skiaMock.Skia.Data.fromURI = jest.fn(() => Promise.resolve(null));
}

beforeEach(() => {
  require('expo-secure-store').__resetSecureStore?.();
});

// Pending Helix mention-flush timers keep Jest alive after green chat-perf suites.
afterEach(() => {
  require('@app/store/chat/actions/mention-login-lookup').resetMentionLogins();
});

/**
 * A real timer still pending when a test file ends keeps the Jest worker
 * alive, and Jest then force-exits it with a "failed to exit gracefully"
 * warning. Each store debounce has an owner that flushes or cancels it, so a
 * pending timer here is a leak: print the stack that created it.
 * Zero-delay timers are left out, because library code schedules those and
 * they run before the worker exits.
 */
const pendingRealTimers = new Map<ReturnType<typeof setTimeout>, string>();
const realSetTimeout = global.setTimeout;
const realClearTimeout = global.clearTimeout;

// SAFETY: the wrapper takes the same arguments and returns the real handle, so it keeps the setTimeout contract.
global.setTimeout = ((
  callback: (...args: unknown[]) => void,
  ms?: number,
  ...args: unknown[]
) => {
  const handle = realSetTimeout(
    (...callbackArgs: unknown[]) => {
      pendingRealTimers.delete(handle);
      callback(...callbackArgs);
    },
    ms,
    ...args,
  );

  if (ms) {
    pendingRealTimers.set(
      handle,
      new Error(`${ms}ms timer`).stack ?? `${ms}ms timer`,
    );
  }

  return handle;
}) as typeof setTimeout;

// SAFETY: the wrapper forwards the handle unchanged to the real clearTimeout.
global.clearTimeout = ((handle?: ReturnType<typeof setTimeout>) => {
  if (handle) {
    pendingRealTimers.delete(handle);
  }

  realClearTimeout(handle);
}) as typeof clearTimeout;

afterAll(() => {
  // console output is muted in this suite, so write to stderr directly.
  for (const stack of pendingRealTimers.values()) {
    process.stderr.write(
      `A real timer is still pending after ${expect.getState().testPath}: ${stack}\n`,
    );
  }
});
