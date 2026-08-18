import {
  createChatTags,
  createEmoteData,
  createTwitchEmote,
} from '@app/components/Chat/hooks/__tests__/__fixtures__/useChat.fixture';
import * as personalEmotes from '@app/store/chat/actions/personalEmotes';
import type { SanitisedEmote } from '@app/types/emote';
import * as emoteProcessor from '@app/utils/chat/emoteProcessor';
import { createUserStateFromTags } from '@app/utils/chat/messageHandlers/createUserStateFromTags';

import { resolveMessageEmoteParts } from '../resolveMessageEmoteParts';

const worklet = jest.spyOn(emoteProcessor, 'processEmotesWorklet');
const mockGetUserPersonalEmotes = jest.spyOn(
  personalEmotes,
  'getUserPersonalEmotes',
);

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
  worklet.mockReset();
  worklet.mockReturnValue([]);
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

    expect(lastWorkletArgs().twitchSubscriberEmotes).toEqual<SanitisedEmote[]>([
      subscriberEmote,
    ]);
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

    expect(lastWorkletArgs().twitchSubscriberEmotes).toEqual<SanitisedEmote[]>(
      [],
    );
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
    expect(lastWorkletArgs().sevenTvPersonalEmotes).toEqual<SanitisedEmote[]>([
      personalEmote,
    ]);
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
    expect(lastWorkletArgs().sevenTvPersonalEmotes).toEqual<SanitisedEmote[]>(
      [],
    );
  });
});
