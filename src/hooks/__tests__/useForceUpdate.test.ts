/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type {
  RemoteConfigSchema,
  RemoteConfigType,
  UseRemoteConfigResult,
} from '@app/hooks/firebase/useRemoteConfig';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useForceUpdate } from '../useForceUpdate';

jest.mock('@react-native-firebase/installations');
jest.mock('@react-native-firebase/app');
jest.mock('@react-native-firebase/remote-config');
jest.mock('@app/hooks/firebase/useRemoteConfig');
jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
}));

const mockPlatform = Platform as { OS: 'ios' | 'android' };

const mockUseRemoteConfig = jest.mocked(useRemoteConfig);

const createMockRemoteConfig = (
  versions: RemoteConfigSchema['minimumVersion'],
): UseRemoteConfigResult => ({
  config: {
    minimumVersion: {
      raw: JSON.stringify(versions),
      value: versions,
      source: 'remote',
    },
  } as RemoteConfigType,
  refetch: jest.fn().mockResolvedValue(true),
  isRefetching: false,
});

const createSimpleMockConfig = ({
  testflight = '0.0.0',
  internal = '0.0.0',
  production = '0.0.0',
  development = '0.0.0',
}: {
  testflight?: string;
  internal?: string;
  production?: string;
  development?: string;
}): UseRemoteConfigResult =>
  createMockRemoteConfig({
    android: {
      development,
      internal,
      testflight,
      production,
    },
    ios: {
      development,
      internal,
      testflight,
      production,
    },
  });

describe('useForceUpdate', () => {
  const originalAppVariant = process.env.EXPO_PUBLIC_APP_VARIANT;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_APP_VARIANT;
  });

  afterAll(() => {
    if (originalAppVariant !== undefined) {
      process.env.EXPO_PUBLIC_APP_VARIANT = originalAppVariant;
    } else {
      delete process.env.EXPO_PUBLIC_APP_VARIANT;
    }
  });

  describe('development variant', () => {
    test('should return updateRequired=false for development variant', () => {
      process.env.EXPO_PUBLIC_APP_VARIANT = 'development';
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '2.0.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('0.0.0');
      expect(current.variant).toBe('development');
    });
  });

  describe('testflight variant', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_APP_VARIANT = 'testflight';
    });

    test('should return updateRequired=true when current version is below testflight minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '2.0.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
      expect(current.minimumVersion).toBe('2.0.0');
      expect(current.currentVersion).toBe('1.0.0');
      expect(current.variant).toBe('testflight');
    });

    test('should return updateRequired=false when current version equals testflight minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '1.0.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('1.0.0');
      expect(current.variant).toBe('testflight');
    });

    test('should return updateRequired=false when current version is above testflight minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '0.9.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('0.9.0');
      expect(current.variant).toBe('testflight');
    });

    test('should return updateRequired=false when testflight minimum version is empty', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('');
    });
  });

  describe('production variant', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_APP_VARIANT = 'production';
    });

    test('should return updateRequired=true when current version is below production minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '1.0.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
      expect(current.minimumVersion).toBe('2.0.0');
      expect(current.currentVersion).toBe('1.0.0');
      expect(current.variant).toBe('production');
    });

    test('should return updateRequired=false when current version equals production minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '2.0.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('1.0.0');
      expect(current.variant).toBe('production');
    });

    test('should return updateRequired=false when current version is above production minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '2.0.0', production: '0.9.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('0.9.0');
      expect(current.variant).toBe('production');
    });

    test('should return updateRequired=false when production minimum version is empty', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '1.0.0', production: '' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('');
    });
  });

  describe('unknown variant', () => {
    test('should return updateRequired=false for unknown variant', () => {
      process.env.EXPO_PUBLIC_APP_VARIANT = 'unknown';
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '2.0.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('');
    });
  });

  describe('version comparison', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_APP_VARIANT = 'testflight';
    });

    test('should correctly identify when patch version update is required', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '1.0.1', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
    });

    test('should correctly identify when minor version update is required', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '1.1.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
    });

    test('should correctly identify when major version update is required', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '2.0.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
    });

    test('should return updateRequired=false when both versions are empty', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '', production: '' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
    });
  });

  describe('return values', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_APP_VARIANT = 'testflight';
    });

    test('should return all expected properties', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '1.0.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current).toHaveProperty('updateRequired');
      expect(current).toHaveProperty('minimumVersion');
      expect(current).toHaveProperty('currentVersion');
      expect(current).toHaveProperty('variant');
    });

    test('should return current version from Application', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ testflight: '1.0.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.currentVersion).toBe('1.0.0');
    });
  });

  describe('platform-specific versions', () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_APP_VARIANT = 'testflight';
    });

    describe('iOS platform', () => {
      beforeEach(() => {
        mockPlatform.OS = 'ios';
      });

      test('should use iOS testflight version when on iOS', () => {
        mockUseRemoteConfig.mockReturnValue(
          createMockRemoteConfig({
            android: {
              development: '0.0.0',
              internal: '0.0.0',
              testflight: '1.0.0',
              production: '1.0.0',
            },
            ios: {
              development: '0.0.0',
              internal: '0.0.0',
              testflight: '2.0.0',
              production: '1.0.0',
            },
          }),
        );

        const {
          result: { current },
        } = renderHook(() => useForceUpdate());

        expect(current.updateRequired).toBe(true);
        expect(current.minimumVersion).toBe('2.0.0');
      });

      test('should use iOS production version when on iOS with production variant', () => {
        process.env.EXPO_PUBLIC_APP_VARIANT = 'production';
        mockUseRemoteConfig.mockReturnValue(
          createMockRemoteConfig({
            android: {
              development: '0.0.0',
              internal: '0.0.0',
              testflight: '1.0.0',
              production: '1.0.0',
            },
            ios: {
              development: '0.0.0',
              internal: '0.0.0',
              testflight: '1.0.0',
              production: '2.0.0',
            },
          }),
        );

        const {
          result: { current },
        } = renderHook(() => useForceUpdate());

        expect(current.updateRequired).toBe(true);
        expect(current.minimumVersion).toBe('2.0.0');
      });
    });

    describe('Android platform', () => {
      beforeEach(() => {
        mockPlatform.OS = 'android';
      });

      test('should use Android testflight version when on Android', () => {
        mockUseRemoteConfig.mockReturnValue(
          createMockRemoteConfig({
            android: {
              development: '0.0.0',
              internal: '0.0.0',
              testflight: '2.0.0',
              production: '1.0.0',
            },
            ios: {
              development: '0.0.0',
              internal: '0.0.0',
              testflight: '1.0.0',
              production: '1.0.0',
            },
          }),
        );

        const {
          result: { current },
        } = renderHook(() => useForceUpdate());

        expect(current.updateRequired).toBe(true);
        expect(current.minimumVersion).toBe('2.0.0');
      });

      test('should use Android production version when on Android with production variant', () => {
        process.env.EXPO_PUBLIC_APP_VARIANT = 'production';
        mockUseRemoteConfig.mockReturnValue(
          createMockRemoteConfig({
            android: {
              development: '0.0.0',
              internal: '0.0.0',
              testflight: '1.0.0',
              production: '2.0.0',
            },
            ios: {
              development: '0.0.0',
              internal: '0.0.0',
              testflight: '1.0.0',
              production: '1.0.0',
            },
          }),
        );

        const {
          result: { current },
        } = renderHook(() => useForceUpdate());

        expect(current.updateRequired).toBe(true);
        expect(current.minimumVersion).toBe('2.0.0');
      });
    });
  });
});
