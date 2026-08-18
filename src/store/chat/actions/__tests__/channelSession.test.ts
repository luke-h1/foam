import * as channelLoad from '@app/store/chat/actions/channelLoad';
import * as chatColorCaches from '@app/store/chat/actions/chatColorCaches';
import * as cosmetics from '@app/store/chat/actions/cosmetics';
import * as messages from '@app/store/chat/actions/messages';
import * as personalEmotes from '@app/store/chat/actions/personalEmotes';
import * as userCosmeticsFetch from '@app/store/chat/actions/userCosmeticsFetch';
import * as visibleAssetHydration from '@app/store/chat/actions/visibleAssetHydration';
import * as resetMentionLoginResolverModule from '@app/utils/chat/mentionLoginResolver/resetMentionLoginResolver';

import { resetChannelSession } from '../channelSession';

const allResets = {
  abortCurrentLoad: jest
    .spyOn(channelLoad, 'abortCurrentLoad')
    .mockImplementation(() => {}),
  clearChannelResources: jest
    .spyOn(channelLoad, 'clearChannelResources')
    .mockImplementation(() => {}),
  /**
   * channelLoad re-exports this from personalEmotes, and babel's CJS
   * re-export getter is non-configurable, so the spy has to sit on the
   * originating module for channelLoad's getter to pick it up.
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
