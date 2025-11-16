/* eslint-disable no-undef */
/* eslint-disable no-restricted-imports */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-require-imports */
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';
import 'react-native-url-polyfill/auto';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import * as ReactNative from 'react-native';
import 'cross-fetch/polyfill';
import '@app/hooks/useAppNavigation';
import '../src/styles/unistyles';
import { configure as configureReassure } from 'reassure';
import { TextEncoder, TextDecoder } from 'util';
import mockFile from '../__mocks__/mockFile';

// Polyfill TextEncoder/TextDecoder for Node.js environment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

configureReassure({ testingLibrary: 'react-native' });

jest.mock('expo-font');
jest.mock('expo-asset');
// Mock react-native-vector-icons - mocks are in __mocks__ directory
jest.mock('react-native-vector-icons');

/**
 * Polyfill for setImmediate which Sentry uses under the hood
 */
global.setImmediate =
  global.setImmediate ||
  ((callback: (...args: any[]) => void, ...args: any) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    setTimeout(callback, 0, ...args));

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  const { EventEmitter } = require('events');
  return {
    __esModule: true,
    default: EventEmitter,
  };
});

// include this section and the NativeAnimatedHelper section for mocking react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});

// jest.mock('@app/hooks/useAppNavigation', () => {
//   const mockNavigation: Partial<NativeStackNavigationProp<AppStackParamList>> =
//     {
//       navigate: jest.fn(),
//       goBack: jest.fn(),
//       ...jest.requireActual('@reac')
//     };

//   return () => mockNavigation as NativeStackNavigationProp<AppStackParamList>;
// });

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-webview', () => {
  const MockWebView = jest.requireActual('react-native').View;

  return {
    __esModule: true,
    WebView: MockWebView,
    default: MockWebView,
  };
});

jest.doMock('react-native', () => {
  return Object.setPrototypeOf(
    {
      Share: {
        ...ReactNative.Share,
        share: jest.fn(),
      },
      Image: {
        ...ReactNative.Image,
        resolveAssetSource: jest.fn(_source => mockFile),
        getSize: jest.fn(
          (
            _uri: string,
            success: (width: number, height: number) => void,
            _failure?: (_error: any) => void,
          ) => success(100, 100),
        ),
      },
    },
    ReactNative,
  );
});

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mocks are in __mocks__ directory - Jest will auto-discover them
jest.mock('react-native-nitro-modules');
jest.mock('react-native-unistyles');
jest.mock('react-native-keyboard-controller');
jest.mock('expo-task-manager');
jest.mock('expo-background-task');
jest.mock('expo-updates');

// expo/fetch needs manual mock due to path structure
jest.mock('expo/fetch');
