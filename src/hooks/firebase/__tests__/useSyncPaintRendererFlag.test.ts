import { Platform } from 'react-native';

import { renderHook } from '@testing-library/react-native';

import {
  buildRemoteConfigFromDefaults,
  parseRemoteConfigValue,
} from '@app/hooks/firebase/remoteConfigModel';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { paintRendererFlag$ } from '@app/store/preferences/state';

import { useSyncPaintRendererFlag } from '../useSyncPaintRendererFlag';

jest.mock('@app/hooks/firebase/useRemoteConfig', () => ({
  useRemoteConfig: jest.fn(),
}));

const useRemoteConfigMock = jest.mocked(useRemoteConfig);

function mockFlag(raw: string): void {
  const config = buildRemoteConfigFromDefaults('default');
  config.sevenTvPaintRenderer = {
    raw,
    value: parseRemoteConfigValue('sevenTvPaintRenderer', raw),
    source: 'remote',
  };
  useRemoteConfigMock.mockReturnValue({
    config,
    refetch: jest.fn(),
    isRefetching: false,
    isLoading: false,
  });
}

describe('useSyncPaintRendererFlag', () => {
  afterEach(() => {
    paintRendererFlag$.set('native');
  });

  test('mirrors the skia flag into the observable', () => {
    mockFlag('skia');
    renderHook(() => useSyncPaintRendererFlag());
    expect(paintRendererFlag$.peek()).toEqual('skia');
  });

  test('mirrors the off escape hatch into the observable', () => {
    mockFlag('off');
    renderHook(() => useSyncPaintRendererFlag());
    expect(paintRendererFlag$.peek()).toEqual('off');
  });

  test('sanitizes unknown values to native', () => {
    mockFlag('webview');
    renderHook(() => useSyncPaintRendererFlag());
    expect(paintRendererFlag$.peek()).toEqual('native');
  });

  test('keeps the native renderer on web even when the flag says skia', () => {
    const originalOs = Platform.OS;
    Platform.OS = 'web';
    try {
      mockFlag('skia');
      renderHook(() => useSyncPaintRendererFlag());
      expect(paintRendererFlag$.peek()).toEqual('native');
    } finally {
      Platform.OS = originalOs;
    }
  });
});
