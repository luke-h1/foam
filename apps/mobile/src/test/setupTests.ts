import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import * as ReactNative from 'react-native';

jest.doMock('react-native', () => {
  return Object.setPrototypeOf(
    {
      Share: {
        ...ReactNative.Share,
        share: jest.fn(),
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
