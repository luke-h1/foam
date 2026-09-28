import * as channelLoad from '@app/store/chat/actions/channel-load';
import * as chatColorCaches from '@app/store/chat/actions/chat-color-caches';
import * as cosmetics from '@app/store/chat/actions/cosmetics';
import * as messages from '@app/store/chat/actions/messages';
import * as personalEmotes from '@app/store/chat/actions/personal-emotes';
import * as userCosmeticsFetch from '@app/store/chat/actions/user-cosmetics-fetch';
import * as visibleAssetHydration from '@app/store/chat/actions/visible-asset-hydration';
import * as resetMentionLoginResolverModule from '@app/utils/chat/mention-login-resolver/reset-mention-login-resolver';

import { resetChannelSession } from '../channel-session';

const allResets = {
  abortCurrentLoad: jest
    .spyOn(channelLoad, 'abortCurrentLoad')
    .mockImplementation(() => {}),
  clearChannelResources: jest
    .spyOn(channelLoad, 'clearChannelResources')
    .mockImplementation(() => {}),
  /**
   * babel's CJS re-export getter is non-configurable, so the spy has to sit
   * on the originating module for channelLoad's getter to pick it up.
   */
  clearPersonalEmotesCache: jest
    .spyOn(personalEmotes, 'clearPersonalEmotesCache')
    .mockImplementation(() => {}),
  clearMentionSessionCaches: jest
    .spyOn(chatColorCaches, 'clearMentionSessionCaches')
    .mockImplementation(() => {}),
  clearPaintBindings: jest
    .spyOn(cosmetics, 'clearPaintBindings')
    .mockImplementation(() => {}),
  clearMessages: jest
    .spyOn(messages, 'clearMessages')
    .mockImplementation(() => {}),
  clearFetchedCosmeticsUsers: jest
    .spyOn(userCosmeticsFetch, 'clearFetchedCosmeticsUsers')
    .mockImplementation(() => {}),
  clearVisibleAssetHydration: jest
    .spyOn(visibleAssetHydration, 'clearVisibleAssetHydration')
    .mockImplementation(() => {}),
  resetMentionLoginResolver: jest
    .spyOn(resetMentionLoginResolverModule, 'resetMentionLoginResolver')
    .mockImplementation(() => {}),
};

function calledResets(): string[] {
  return Object.entries(allResets)
    .filter(([, mock]) => mock.mock.calls.length > 0)
    .map(([name]) => name)
    .sort();
}

describe('resetChannelSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('leave stops the load and clears channel resources without touching rendered messages', () => {
    resetChannelSession('leave');

    expect(calledResets()).toEqual([
      'abortCurrentLoad',
      'clearChannelResources',
      'clearMentionSessionCaches',
    ]);
  });

  test('unmount clears every module-level cache the session owns', () => {
    resetChannelSession('unmount');

    expect(calledResets()).toEqual([
      'abortCurrentLoad',
      'clearChannelResources',
      'clearFetchedCosmeticsUsers',
      'clearMentionSessionCaches',
      'clearPaintBindings',
      'clearPersonalEmotesCache',
      'clearVisibleAssetHydration',
      'resetMentionLoginResolver',
    ]);
  });

  test('switch drops the committed window, mention caches and hydration keys', () => {
    resetChannelSession('switch');

    expect(calledResets()).toEqual([
      'clearMentionSessionCaches',
      'clearMessages',
      'clearVisibleAssetHydration',
    ]);
  });

  test('part drops only the committed window', () => {
    resetChannelSession('part');

    expect(calledResets()).toEqual(['clearMessages']);
  });
});
