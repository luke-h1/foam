/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';
import 'react-native-url-polyfill/auto';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import * as ReactNative from 'react-native';
import mockFile from './mockFile';
import 'cross-fetch/polyfill';
import 'core-js';
import '@app/hooks/useAppNavigation';

jest.mock('expo-font');
jest.mock('expo-asset');
jest.mock('react-native-vector-icons', () => {
  return {
    __esModule: true,
    ...jest.requireActual('react-native-vector-icons'),
  };
});

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

// jest.mock('expo-modules-core', () => ({
//   requireNativeModule: jest.fn().mockImplementation(moduleName => {
//     if (moduleName === 'ExpoPlatformInfo') {
//       return {
//         getIsReducedMotionEnabled: () => false,
//       };
//     }
//     if (moduleName === 'BottomSheet') {
//       return {
//         dismissAll: () => {},
//       };
//     }
//     console.log('moduleName ->', moduleName);
//   }),
//   requireNativeViewManager: jest.fn().mockImplementation(moduleName => {
//     return () => null;
//   }),
// }));
