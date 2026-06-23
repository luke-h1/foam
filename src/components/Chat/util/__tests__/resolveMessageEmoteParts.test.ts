import {
  createChatTags,
  createEmoteData,
  createTwitchEmote,
} from '@app/components/Chat/hooks/__tests__/__fixtures__/useChat.fixture';
import { createUserStateFromTags } from '@app/components/Chat/util/messageHandlers';
import { getUserPersonalEmotes } from '@app/store/chat/actions/channelLoad';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';

import { resolveMessageEmoteParts } from '../resolveMessageEmoteParts';

jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getCurrentEmoteData: jest.fn(),
  getUserPersonalEmotes: jest.fn(() => []),
}));

jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    emojis: {
      peek: jest.fn(() => []),
    },
  },
}));

jest.mock('@app/utils/chat/emoteProcessor', () => ({
  processEmotesWorklet: jest.fn(() => []),
}));

const worklet = jest.mocked(processEmotesWorklet);
const mockGetUserPersonalEmotes = jest.mocked(getUserPersonalEmotes);

const channelId = 'channel-1';
const subscriberEmote = createTwitchEmote({
  id: 'sub-1',
  name: 'SubEmote',
  site: 'Twitch Subscriber',
});

function lastWorkletArgs() {
  return worklet.mock.calls[worklet.mock.calls.length - 1]![0];
}

beforeEach(() => {
  worklet.mockClear();
  mockGetUserPersonalEmotes.mockReset();
  mockGetUserPersonalEmotes.mockReturnValue([]);
});

describe('resolveMessageEmoteParts subscriber scoping', () => {
  test('includes the channel subscriber emotes when the sender is the current user', () => {
    const userstate = createUserStateFromTags(createChatTags({ login: 'me' }));

    resolveMessageEmoteParts({
      channelId,
      emoteData: createEmoteData({ twitchSubscriberEmotes: [subscriberEmote] }),
      show7TvEmotes: true,
      text: 'hello',
      userId: 'user-1',
      userLogin: 'me',
      userstate,
    });

    expect(lastWorkletArgs().twitchSubscriberEmotes).toEqual([subscriberEmote]);
  });

  test('omits the channel subscriber emotes for other senders', () => {
    const userstate = createUserStateFromTags(
      createChatTags({ login: 'someone-else' }),
    );

    resolveMessageEmoteParts({
      channelId,
      emoteData: createEmoteData({ twitchSubscriberEmotes: [subscriberEmote] }),
      show7TvEmotes: true,
      text: 'hello',
      userId: 'user-1',
      userLogin: 'me',
      userstate,
    });

    expect(lastWorkletArgs().twitchSubscriberEmotes).toEqual([]);
  });
});

describe('resolveMessageEmoteParts personal emotes', () => {
  test('feeds the user personal emotes when 7TV emotes are enabled', () => {
    const personalEmote = createTwitchEmote({ id: 'p-1', name: 'Personal' });
    mockGetUserPersonalEmotes.mockReturnValue([personalEmote]);
    const userstate = createUserStateFromTags(createChatTags({ login: 'me' }));

    resolveMessageEmoteParts({
      channelId,
      emoteData: createEmoteData(),
      show7TvEmotes: true,
      text: 'hello',
      userId: 'user-1',
      userLogin: 'me',
      userstate,
    });

    expect(mockGetUserPersonalEmotes).toHaveBeenCalledWith('user-1', channelId);
    expect(lastWorkletArgs().sevenTvPersonalEmotes).toEqual([personalEmote]);
  });

  test('skips personal emote lookup when 7TV emotes are disabled', () => {
    const userstate = createUserStateFromTags(createChatTags({ login: 'me' }));

    resolveMessageEmoteParts({
      channelId,
      emoteData: createEmoteData(),
      show7TvEmotes: false,
      text: 'hello',
      userId: 'user-1',
      userLogin: 'me',
      userstate,
    });

    expect(mockGetUserPersonalEmotes).not.toHaveBeenCalled();
    expect(lastWorkletArgs().sevenTvPersonalEmotes).toEqual([]);
  });
});
