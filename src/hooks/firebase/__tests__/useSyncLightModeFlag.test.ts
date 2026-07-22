import { renderHook } from '@testing-library/react-native';

import {
  buildRemoteConfigFromDefaults,
  parseRemoteConfigValue,
} from '@app/hooks/firebase/remoteConfigModel';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { lightModeEnabled$ } from '@app/store/preferences/state';

import { useSyncLightModeFlag } from '../useSyncLightModeFlag';

jest.mock('@app/hooks/firebase/useRemoteConfig', () => ({
  useRemoteConfig: jest.fn(),
}));

const useRemoteConfigMock = jest.mocked(useRemoteConfig);

function mockFlag(raw: string): void {
  const config = buildRemoteConfigFromDefaults('default');
  config.lightModeEnabled = {
    raw,
    value: parseRemoteConfigValue('lightModeEnabled', raw),
    source: 'remote',
  };
  useRemoteConfigMock.mockReturnValue({
    config,
    refetch: jest.fn(),
    isRefetching: false,
    isLoading: false,
  });
}

describe('useSyncLightModeFlag', () => {
  afterEach(() => {
    lightModeEnabled$.set(false);
  });

  test('mirrors the current track value into the observable', () => {
    mockFlag(
      '{ "development": true, "internal": true, "testflight": false, "production": false, "e2e": false }',
    );
    renderHook(() => useSyncLightModeFlag());
    expect(lightModeEnabled$.peek()).toEqual(true);
  });

  test('stays dark when the current track is off', () => {
    mockFlag(
      '{ "development": false, "internal": false, "testflight": false, "production": false, "e2e": false }',
    );
    renderHook(() => useSyncLightModeFlag());
    expect(lightModeEnabled$.peek()).toEqual(false);
  });

  test('falls back to dark when the track is missing from the payload', () => {
    mockFlag('{ "production": true }');
    renderHook(() => useSyncLightModeFlag());
    expect(lightModeEnabled$.peek()).toEqual(false);
  });
});
