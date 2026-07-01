import { renderHook } from '@testing-library/react-native';

import { useChatTransientState } from '../useChatTransientState';

test('clears visible-asset dedup guards when the channel changes', () => {
  const { result, rerender } = renderHook(
    ({ channelId }) => useChatTransientState(channelId),
    { initialProps: { channelId: 'channel-a' } },
  );

  result.current.visiblePersonalEmoteUsersRef.current.add('user-1');
  result.current.visibleCosmeticUsersRef.current.add('user-2');
  result.current.hydratedVisibleAssetKeysRef.current.add('key-1');

  rerender({ channelId: 'channel-b' });

  expect(result.current.visiblePersonalEmoteUsersRef.current.size).toBe(0);
  expect(result.current.visibleCosmeticUsersRef.current.size).toBe(0);
  expect(result.current.hydratedVisibleAssetKeysRef.current.size).toBe(0);
});

test('keeps dedup guards intact while the channel stays the same', () => {
  const { result, rerender } = renderHook(
    ({ channelId }) => useChatTransientState(channelId),
    { initialProps: { channelId: 'channel-a' } },
  );

  result.current.visiblePersonalEmoteUsersRef.current.add('user-1');

  rerender({ channelId: 'channel-a' });

  expect(result.current.visiblePersonalEmoteUsersRef.current.size).toBe(1);
});
