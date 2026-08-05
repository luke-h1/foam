import { renderHook } from '@testing-library/react-native';

import {
  clearVisibleAssetHydration,
  visibleAssetHydration,
} from '@app/store/chat/actions/visibleAssetHydration';

import { useChatTransientState } from '../useChatTransientState';

beforeEach(() => {
  clearVisibleAssetHydration();
});

test('clears visible-asset dedup guards when the channel changes', () => {
  const { rerender } = renderHook(
    ({ channelId }: { channelId: string }) => useChatTransientState(channelId),
    { initialProps: { channelId: 'channel-a' } },
  );

  visibleAssetHydration.personalEmoteUsers.add('user-1');
  visibleAssetHydration.cosmeticUsers.add('user-2');
  visibleAssetHydration.hydratedMessageKeys.add('key-1');

  rerender({ channelId: 'channel-b' });

  expect(visibleAssetHydration.personalEmoteUsers.size).toBe(0);
  expect(visibleAssetHydration.cosmeticUsers.size).toBe(0);
  expect(visibleAssetHydration.hydratedMessageKeys.size).toBe(0);
});

test('keeps dedup guards intact while the channel stays the same', () => {
  const { rerender } = renderHook(
    ({ channelId }: { channelId: string }) => useChatTransientState(channelId),
    { initialProps: { channelId: 'channel-a' } },
  );

  visibleAssetHydration.personalEmoteUsers.add('user-1');

  rerender({ channelId: 'channel-a' });

  expect(visibleAssetHydration.personalEmoteUsers.size).toBe(1);
});
