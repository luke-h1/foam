import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import * as ReactNative from 'react-native';
import mockFile from './mockFile';

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

jest.mock('@react-native-async-storage/async-storage', () => {
  return {
    getItem: async (...args: unknown[]) => args,
    setItem: async (...args: unknown[]) => args,
    removeItem: async (...args: unknown[]) => args,
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
