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
  preview = '0.0.0',
  production = '0.0.0',
  development = '0.0.0',
}: {
  preview?: string;
  production?: string;
  development?: string;
}): UseRemoteConfigResult =>
  createMockRemoteConfig({
    android: {
      development,
      preview,
      production,
    },
    ios: {
      development,
      preview,
      production,
    },
  });

describe('useForceUpdate', () => {
  const originalAppVariant = process.env.APP_VARIANT;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.APP_VARIANT;
  });

  afterAll(() => {
    if (originalAppVariant !== undefined) {
      process.env.APP_VARIANT = originalAppVariant;
    } else {
      delete process.env.APP_VARIANT;
    }
  });

  describe('development variant', () => {
    test('should return updateRequired=false for development variant', () => {
      process.env.APP_VARIANT = 'development';
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '2.0.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('');
      expect(current.variant).toBe('development');
    });
  });

  describe('preview variant', () => {
    beforeEach(() => {
      process.env.APP_VARIANT = 'preview';
    });

    test('should return updateRequired=true when current version is below preview minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '2.0.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
      expect(current.minimumVersion).toBe('2.0.0');
      expect(current.currentVersion).toBe('1.0.0');
      expect(current.variant).toBe('preview');
    });

    test('should return updateRequired=false when current version equals preview minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '1.0.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('1.0.0');
      expect(current.variant).toBe('preview');
    });

    test('should return updateRequired=false when current version is above preview minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '0.9.0', production: '2.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('0.9.0');
      expect(current.variant).toBe('preview');
    });

    test('should return updateRequired=false when preview minimum version is empty', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '', production: '1.0.0' }),
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
      process.env.APP_VARIANT = 'production';
    });

    test('should return updateRequired=true when current version is below production minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '1.0.0', production: '2.0.0' }),
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
        createSimpleMockConfig({ preview: '2.0.0', production: '1.0.0' }),
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
        createSimpleMockConfig({ preview: '2.0.0', production: '0.9.0' }),
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
        createSimpleMockConfig({ preview: '1.0.0', production: '' }),
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
      process.env.APP_VARIANT = 'unknown';
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '2.0.0', production: '2.0.0' }),
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
      process.env.APP_VARIANT = 'preview';
    });

    test('should correctly identify when patch version update is required', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '1.0.1', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
    });

    test('should correctly identify when minor version update is required', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '1.1.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
    });

    test('should correctly identify when major version update is required', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '2.0.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(true);
    });

    test('should return updateRequired=false when both versions are empty', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '', production: '' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.updateRequired).toBe(false);
    });
  });

  describe('return values', () => {
    beforeEach(() => {
      process.env.APP_VARIANT = 'preview';
    });

    test('should return all expected properties', () => {
      mockUseRemoteConfig.mockReturnValue(
        createSimpleMockConfig({ preview: '1.0.0', production: '2.0.0' }),
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
        createSimpleMockConfig({ preview: '1.0.0', production: '1.0.0' }),
      );

      const {
        result: { current },
      } = renderHook(() => useForceUpdate());

      expect(current.currentVersion).toBe('1.0.0');
    });
  });

  describe('platform-specific versions', () => {
    beforeEach(() => {
      process.env.APP_VARIANT = 'preview';
    });

    describe('iOS platform', () => {
      beforeEach(() => {
        mockPlatform.OS = 'ios';
      });

      test('should use iOS preview version when on iOS', () => {
        mockUseRemoteConfig.mockReturnValue(
          createMockRemoteConfig({
            android: {
              development: '0.0.0',
              preview: '1.0.0',
              production: '1.0.0',
            },
            ios: {
              development: '0.0.0',
              preview: '2.0.0',
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
        process.env.APP_VARIANT = 'production';
        mockUseRemoteConfig.mockReturnValue(
          createMockRemoteConfig({
            android: {
              development: '0.0.0',
              preview: '1.0.0',
              production: '1.0.0',
            },
            ios: {
              development: '0.0.0',
              preview: '1.0.0',
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

      test('should use Android preview version when on Android', () => {
        mockUseRemoteConfig.mockReturnValue(
          createMockRemoteConfig({
            android: {
              development: '0.0.0',
              preview: '2.0.0',
              production: '1.0.0',
            },
            ios: {
              development: '0.0.0',
              preview: '1.0.0',
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
        process.env.APP_VARIANT = 'production';
        mockUseRemoteConfig.mockReturnValue(
          createMockRemoteConfig({
            android: {
              development: '0.0.0',
              preview: '1.0.0',
              production: '2.0.0',
            },
            ios: {
              development: '0.0.0',
              preview: '1.0.0',
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
