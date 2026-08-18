/* eslint-disable no-undef */
/* eslint-disable no-restricted-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-require-imports */
import '@testing-library/jest-native/extend-expect';
import 'react-native-url-polyfill/auto';
import 'cross-fetch/polyfill';

import type { ReactNode, Ref } from 'react';

import type { SkData } from '@shopify/react-native-skia';
import { configure as configureReassure } from 'reassure';
import { TextDecoder, TextEncoder } from 'util';

import mockFile from '../__mocks__/mockFile';

// Polyfill TextEncoder/TextDecoder for Node.js environment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.TextEncoder = TextEncoder;
// SAFETY: Node's util.TextDecoder implements the DOM TextDecoder surface the app code decodes with.
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

configureReassure({ testingLibrary: 'react-native' });

/**
 * The Skia jest mock renders components as plain Views but routes imperative
 * calls (Skia.Path.Make etc.) to global.CanvasKit, which is never loaded in
 * jsdom. Nothing is actually drawn in tests, so a call-through proxy is enough.
 */
function canvasKitStub(): any {
  return new Proxy(function () {}, {
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const skia = require('@shopify/react-native-skia') as {
    useAnimatedImageValue?: () => { value?: unknown };
  };
  if (skia.useAnimatedImageValue === undefined) {
    skia.useAnimatedImageValue = () => ({});
  }
}

/**
 * Polyfill for setImmediate which Sentry uses under the hood
 */
global.setImmediate =
  global.setImmediate ||
  ((callback: (...args: any[]) => void, ...args: any) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setTimeout(callback, 0, ...args));

const createReactNativeHostMock = (hostName: string) =>
  // SAFETY: require('react') has no static type here; forwardRef is a real function on the real module.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (require('react').forwardRef as any)(
    ({ children, ...props }: { children?: ReactNode }, ref: Ref<unknown>) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const skiaMock = require('@shopify/react-native-skia') as {
  Skia?: { Data?: { fromURI?: (uri: string) => Promise<SkData | null> } };
};
if (skiaMock.Skia?.Data) {
  skiaMock.Skia.Data.fromURI = jest.fn(() => Promise.resolve(null));
}
