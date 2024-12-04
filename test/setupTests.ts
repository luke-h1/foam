import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import * as ReactNative from 'react-native';
import mockFile from './mockFile';
import 'cross-fetch/polyfill';
import 'core-js';
import '@testing-library/jest-native/extend-expect';

import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
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

jest.mock('expo-font');

// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.doMock('react-native', () => {
  return Object.setPrototypeOf(
    {
      Share: {
        ...ReactNative.Share,
        share: jest.fn(),
      },
      Image: {
        ...ReactNative.Image,
        resolveAssetSource: jest.fn(_source => mockFile), // eslint-disable-line @typescript-eslint/no-unused-vars
        getSize: jest.fn(
          (
            uri: string, // eslint-disable-line @typescript-eslint/no-unused-vars
            success: (width: number, height: number) => void,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            failure?: (_error: any) => void, // eslint-disable-line @typescript-eslint/no-unused-vars
          ) => success(100, 100),
        ),
      },
    },
    ReactNative,
  );
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
