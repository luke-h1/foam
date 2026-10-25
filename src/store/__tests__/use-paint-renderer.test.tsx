import { Platform } from 'react-native';

import { renderHook } from '@testing-library/react-native';

import {
  initialPreferences,
  replacePreferences,
  usePaintRenderer,
} from '../preference-store';

jest.mock('@app/utils/dev-tools/is-dev-tools-enabled', () => ({
  isDevToolsEnabled: true,
}));

describe('usePaintRenderer', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOs;
    replacePreferences({ ...initialPreferences, updatedAt: 1 });
  });

  test('maps a skia dev preference to native on web', () => {
    Platform.OS = 'web';
    replacePreferences({
      ...initialPreferences,
      updatedAt: 1,
      sevenTvPaintRenderer: 'skia',
    });

    const { result } = renderHook(() => usePaintRenderer());

    expect(result.current).toEqual('native');
  });

  test('keeps a skia dev preference on native', () => {
    Platform.OS = 'ios';
    replacePreferences({
      ...initialPreferences,
      updatedAt: 1,
      sevenTvPaintRenderer: 'skia',
    });

    const { result } = renderHook(() => usePaintRenderer());

    expect(result.current).toEqual('skia');
  });
});
