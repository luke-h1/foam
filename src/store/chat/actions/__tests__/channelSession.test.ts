import { resetChannelSession } from '../channelSession';

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  abortCurrentLoad: jest.fn(),
  clearChannelResources: jest.fn(),
  clearPersonalEmotesCache: jest.fn(),
}));
jest.mock('@app/store/chat/actions/chatColorCaches', () => ({
  clearMentionSessionCaches: jest.fn(),
}));
jest.mock('@app/store/chat/actions/cosmetics', () => ({
  clearPaintBindings: jest.fn(),
}));
jest.mock('@app/store/chat/actions/messages', () => ({
  clearMessages: jest.fn(),
}));
jest.mock('@app/store/chat/actions/userCosmeticsFetch', () => ({
  clearFetchedCosmeticsUsers: jest.fn(),
}));
jest.mock('@app/store/chat/actions/visibleAssetHydration', () => ({
  clearVisibleAssetHydration: jest.fn(),
}));
jest.mock(
  '@app/utils/chat/mentionLoginResolver/resetMentionLoginResolver',
  () => ({
    resetMentionLoginResolver: jest.fn(),
  }),
);

import {
  abortCurrentLoad,
  clearChannelResources,
  clearPersonalEmotesCache,
} from '@app/store/chat/actions/channelLoad';
import { clearMentionSessionCaches } from '@app/store/chat/actions/chatColorCaches';
import { clearPaintBindings } from '@app/store/chat/actions/cosmetics';
import { clearMessages } from '@app/store/chat/actions/messages';
import { clearFetchedCosmeticsUsers } from '@app/store/chat/actions/userCosmeticsFetch';
import { clearVisibleAssetHydration } from '@app/store/chat/actions/visibleAssetHydration';
import { resetMentionLoginResolver } from '@app/utils/chat/mentionLoginResolver/resetMentionLoginResolver';

const allResets = {
  abortCurrentLoad: jest.mocked(abortCurrentLoad),
  clearChannelResources: jest.mocked(clearChannelResources),
  clearPersonalEmotesCache: jest.mocked(clearPersonalEmotesCache),
  clearMentionSessionCaches: jest.mocked(clearMentionSessionCaches),
  clearPaintBindings: jest.mocked(clearPaintBindings),
  clearMessages: jest.mocked(clearMessages),
  clearFetchedCosmeticsUsers: jest.mocked(clearFetchedCosmeticsUsers),
  clearVisibleAssetHydration: jest.mocked(clearVisibleAssetHydration),
  resetMentionLoginResolver: jest.mocked(resetMentionLoginResolver),
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
