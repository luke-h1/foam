import { Platform } from 'react-native';

import { renderHook, waitFor } from '@testing-library/react-native';

import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';
import { paintRendererFlag$ } from '@app/store/preference-store';

import { useSyncPaintRendererFlag } from '../use-sync-paint-renderer-flag';
import {
  createQueryWrapper,
  resetRemoteConfig,
  serveRemoteConfig,
} from './__fixtures__/use-remote-config.fixture';

async function syncFlagFromRemote(raw: string) {
  serveRemoteConfig({ sevenTvPaintRenderer: raw });

  const { result } = renderHook(
    () => {
      useSyncPaintRendererFlag();
      return useRemoteConfig().config.sevenTvPaintRenderer.source;
    },
    { wrapper: createQueryWrapper() },
  );

  await waitFor(() => expect(result.current).toBe('remote'));
}

describe('useSyncPaintRendererFlag', () => {
  afterEach(() => {
    resetRemoteConfig();
    paintRendererFlag$.set('native');
  });

  test('mirrors the skia flag into the observable', async () => {
    await syncFlagFromRemote('skia');
    expect(paintRendererFlag$.peek()).toEqual('skia');
  });

  test('mirrors the off escape hatch into the observable', async () => {
    await syncFlagFromRemote('off');
    expect(paintRendererFlag$.peek()).toEqual('off');
  });

  test('sanitizes unknown values to native', async () => {
    paintRendererFlag$.set('off');
    await syncFlagFromRemote('webview');
    expect(paintRendererFlag$.peek()).toEqual('native');
  });

  test('keeps the native renderer on web even when the flag says skia', async () => {
    const originalOs = Platform.OS;
    Platform.OS = 'web';

    try {
      await syncFlagFromRemote('skia');
      expect(paintRendererFlag$.peek()).toEqual('native');
    } finally {
      Platform.OS = originalOs;
    }
  });
});
