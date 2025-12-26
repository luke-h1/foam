import type { RemoteConfigType } from '@app/hooks/firebase/useRemoteConfig';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { renderHook } from '@testing-library/react-native';
import type { Variant } from '../../../app.config';
import { useForceUpdate } from '../useForceUpdate';

jest.mock('@react-native-firebase/installations');
jest.mock('@react-native-firebase/app');
jest.mock('@react-native-firebase/remote-config');
jest.mock('@app/hooks/firebase/useRemoteConfig');
jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
}));

const mockUseRemoteConfig = jest.mocked(useRemoteConfig);

type ForceUpdateResult = {
  updateRequired: boolean;
  minimumVersion: string;
  currentVersion: string | null;
  variant: Variant;
};

const createMockRemoteConfig = (
  previewMinimumVersion: string,
  productionMinimumVersion: string,
): RemoteConfigType =>
  ({
    minimumPreviewVersion: {
      raw: previewMinimumVersion,
      value: previewMinimumVersion,
      source: 'remote',
    },
    minimumProductionVersion: {
      raw: productionMinimumVersion,
      value: productionMinimumVersion,
      source: 'remote',
    },
  }) as RemoteConfigType;

describe('useForceUpdate', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('development variant', () => {
    test('should return updateRequired=false for development variant', () => {
      process.env.APP_VARIANT = 'development';
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('2.0.0', '2.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

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
        createMockRemoteConfig('2.0.0', '1.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(true);
      expect(current.minimumVersion).toBe('2.0.0');
      expect(current.currentVersion).toBe('1.0.0');
      expect(current.variant).toBe('preview');
    });

    test('should return updateRequired=false when current version equals preview minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('1.0.0', '2.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('1.0.0');
      expect(current.variant).toBe('preview');
    });

    test('should return updateRequired=false when current version is above preview minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('0.9.0', '2.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('0.9.0');
      expect(current.variant).toBe('preview');
    });

    test('should return updateRequired=false when preview minimum version is empty', () => {
      mockUseRemoteConfig.mockReturnValue(createMockRemoteConfig('', '1.0.0'));

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

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
        createMockRemoteConfig('1.0.0', '2.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(true);
      expect(current.minimumVersion).toBe('2.0.0');
      expect(current.currentVersion).toBe('1.0.0');
      expect(current.variant).toBe('production');
    });

    test('should return updateRequired=false when current version equals production minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('2.0.0', '1.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('1.0.0');
      expect(current.variant).toBe('production');
    });

    test('should return updateRequired=false when current version is above production minimum', () => {
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('2.0.0', '0.9.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('0.9.0');
      expect(current.variant).toBe('production');
    });

    test('should return updateRequired=false when production minimum version is empty', () => {
      mockUseRemoteConfig.mockReturnValue(createMockRemoteConfig('1.0.0', ''));

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(false);
      expect(current.minimumVersion).toBe('');
    });
  });

  describe('unknown variant', () => {
    test('should return updateRequired=false for unknown variant', () => {
      process.env.APP_VARIANT = 'unknown';
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('2.0.0', '2.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

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
        createMockRemoteConfig('1.0.1', '1.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(true);
    });

    test('should correctly identify when minor version update is required', () => {
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('1.1.0', '1.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(true);
    });

    test('should correctly identify when major version update is required', () => {
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('2.0.0', '1.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(true);
    });

    test('should return updateRequired=false when both versions are empty', () => {
      mockUseRemoteConfig.mockReturnValue(createMockRemoteConfig('', ''));

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.updateRequired).toBe(false);
    });
  });

  describe('return values', () => {
    beforeEach(() => {
      process.env.APP_VARIANT = 'preview';
    });

    test('should return all expected properties', () => {
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('1.0.0', '2.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current).toHaveProperty('updateRequired');
      expect(current).toHaveProperty('minimumVersion');
      expect(current).toHaveProperty('currentVersion');
      expect(current).toHaveProperty('variant');
    });

    test('should return current version from Application', () => {
      mockUseRemoteConfig.mockReturnValue(
        createMockRemoteConfig('1.0.0', '1.0.0'),
      );

      const { result } = renderHook(() => useForceUpdate());
      const current = result.current as ForceUpdateResult;

      expect(current.currentVersion).toBe('1.0.0');
    });
  });
});
