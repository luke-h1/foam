import { makePaint } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paintCss.fixture';
import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import {
  cacheChannelPointRewardTitle,
  clearChannelPointRewardTitles,
  getCachedChannelPointRewardTitle,
} from '@app/store/chat/actions/channelPointRewardTitleStore';
import {
  clearMentionSessionCaches,
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chat/actions/chat-color-caches';
import { addMessage, clearMessages } from '@app/store/chat/actions/messages';
import {
  clearVisibleAssetHydration,
  visibleAssetHydration,
} from '@app/store/chat/actions/visible-asset-hydration';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { makeEmptyEmoteData } from '@app/store/chat/types/constants';
import { flushChatStoreTimers } from '@app/test/chat-store-teardown';
import { silenceLogger } from '@app/test/silence-logger';
import { clearSessionCache as clearImageSessionCache } from '@app/utils/image/imageCache';

import { resetChannelSession } from '../channel-session';

silenceLogger();

interface SessionState {
  currentChannelId: string | null;
  messageIds: string[];
  channelCacheIds: string[];
  paintIds: string[];
  paintBindings: string[];
  mentionColor: string | undefined;
  rewardTitle: string | undefined;
  hydratedMessageKeys: string[];
}

const seededState: SessionState = {
  currentChannelId: 'channel-1',
  messageIds: ['msg-1_nonce-1'],
  channelCacheIds: ['channel-1'],
  paintIds: ['paint-1'],
  paintBindings: ['ttv-1'],
  mentionColor: '#ff0000',
  rewardTitle: 'Hydrate',
  hydratedMessageKeys: ['msg-1_nonce-1'],
};

function seedSession(): void {
  chatStore$.currentChannelId.set('channel-1');
  addMessage(createChatMessageFixture());
  chatStore$.persisted.channelCaches.set({ 'channel-1': makeEmptyEmoteData() });
  chatStore$.paints.set({ 'paint-1': makePaint({}) });
  chatStore$.userPaintIds.set({ 'ttv-1': 'paint-1' });
  setSessionCacheString('mentionColors', 'alice', '#ff0000');
  cacheChannelPointRewardTitle('broadcaster-1', 'reward-1', 'Hydrate');
  visibleAssetHydration.hydratedMessageKeys.add('msg-1_nonce-1');
}

function readSession(): SessionState {
  return {
    currentChannelId: chatStore$.currentChannelId.peek(),
    messageIds: chatStore$.messages.peek().map(message => message.id),
    channelCacheIds: Object.keys(chatStore$.persisted.channelCaches.peek()),
    paintIds: Object.keys(chatStore$.paints.peek()),
    paintBindings: Object.keys(chatStore$.userPaintIds.peek()),
    mentionColor: getSessionCacheString('mentionColors', 'alice'),
    rewardTitle: getCachedChannelPointRewardTitle('broadcaster-1', 'reward-1'),
    hydratedMessageKeys: [...visibleAssetHydration.hydratedMessageKeys],
  };
}

describe('resetChannelSession', () => {
  beforeEach(() => {
    clearMessages();
    clearMentionSessionCaches();
    clearChannelPointRewardTitles();
    clearVisibleAssetHydration();
    seedSession();
  });

  afterEach(() => {
    flushChatStoreTimers();
  });

  test('leave stops the load and clears channel resources without touching rendered messages', () => {
    resetChannelSession('leave');

    expect(readSession()).toEqual<SessionState>({
      ...seededState,
      currentChannelId: null,
      mentionColor: undefined,
    });
  });

  test('unmount clears every module-level cache the session owns', () => {
    resetChannelSession('unmount');

    expect(readSession()).toEqual<SessionState>({
      ...seededState,
      currentChannelId: null,
      paintBindings: [],
      mentionColor: undefined,
      rewardTitle: undefined,
      hydratedMessageKeys: [],
    });
  });

  test('switch drops the committed window, mention state, reward titles and hydration keys', () => {
    resetChannelSession('switch');

    expect(readSession()).toEqual<SessionState>({
      ...seededState,
      messageIds: [],
      mentionColor: undefined,
      rewardTitle: undefined,
      hydratedMessageKeys: [],
    });
  });

  test('part drops the committed window', () => {
    resetChannelSession('part');

    expect(readSession()).toEqual<SessionState>({
      ...seededState,
      messageIds: [],
    });
  });

  test('clear-cosmetics drops the paint definitions and bindings', () => {
    resetChannelSession('clear-cosmetics');

    expect(readSession()).toEqual<SessionState>({
      ...seededState,
      paintIds: [],
      paintBindings: [],
    });
  });

  test('clear-cache drops the cached data, the cosmetics and the hydration keys', () => {
    resetChannelSession('clear-cache');

    clearImageSessionCache();

    expect(readSession()).toEqual<SessionState>({
      ...seededState,
      currentChannelId: null,
      messageIds: [],
      channelCacheIds: [],
      paintIds: [],
      paintBindings: [],
      hydratedMessageKeys: [],
    });
  });
});
