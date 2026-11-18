import { Platform } from 'react-native';

import { renderHook } from '@testing-library/react-native';

import {
  initialPreferences,
  preferences$,
  usePaintRenderer,
} from '../preference-store';

jest.mock('@app/utils/dev-tools/isDevToolsEnabled', () => ({
  isDevToolsEnabled: true,
}));

describe('usePaintRenderer', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOs;
    preferences$.set({ ...initialPreferences, updatedAt: 1 });
  });

  test('maps a skia dev preference to native on web', () => {
    Platform.OS = 'web';
    preferences$.set({
      ...initialPreferences,
      updatedAt: 1,
      sevenTvPaintRenderer: 'skia',
    });

    const { result } = renderHook(() => usePaintRenderer());

    expect(result.current).toEqual('native');
  });

  test('keeps a skia dev preference on native', () => {
    Platform.OS = 'ios';
    preferences$.set({
      ...initialPreferences,
      updatedAt: 1,
      sevenTvPaintRenderer: 'skia',
    });

    const { result } = renderHook(() => usePaintRenderer());

    expect(result.current).toEqual('skia');
  });
});
