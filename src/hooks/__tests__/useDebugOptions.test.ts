import { act, renderHook } from '@testing-library/react-native';

import { storageService } from '@app/lib/storage';

import { type DebugOptions, useDebugOptions } from '../useDebugOptions';

beforeEach(() => {
  storageService.clear();
});

test('updates only when the debug option changes', () => {
  const { result } = renderHook(() => useDebugOptions());
  const initialSnapshot = result.current;

  expect(result.current).toEqual<DebugOptions>({
    ReactQueryDebug: { enabled: false },
  });

  act(() => {
    storageService.set('previous_searches', ['unrelated']);
  });

  expect(result.current).toBe(initialSnapshot);

  act(() => {
    storageService.set('ReactQueryDebug', true);
  });

  expect(result.current).toEqual<DebugOptions>({
    ReactQueryDebug: { enabled: true },
  });
});
