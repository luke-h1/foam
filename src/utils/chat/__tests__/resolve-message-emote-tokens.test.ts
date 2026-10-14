import {
  createChatTags,
  createEmoteData,
  createSevenTvEmote,
  createTwitchEmote,
} from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat.fixture';
import { sevenTvService } from '@app/services/seven-tv-service';
import {
  clearPersonalEmotesCache,
  fetchUserPersonalEmotes,
} from '@app/store/chat/actions/personal-emotes';
import { createUserStateFromTags } from '@app/utils/chat/message-handlers/create-user-state-from-tags';
import type { MessageToken } from '@app/utils/chat/message-token';

import { resolveMessageEmoteParts } from '../resolve-message-emote-tokens';

const channelId = 'channel-1';

const subscriberEmote = createTwitchEmote({
  id: 'sub-1',
  name: 'SubEmote',
  site: 'Twitch Subscriber',
});

const personalEmote = createSevenTvEmote({ id: 'p-1', name: 'PersonalEmote' });

interface EmoteTokenSummary {
  content: string;
  site: string | undefined;
}

function emoteTokens(tokens: MessageToken[]): EmoteTokenSummary[] {
  return tokens.flatMap(token =>
    token.type === 'emote'
      ? [{ content: token.content, site: token.site }]
      : [],
  );
}

async function seedPersonalEmotes() {
  jest
    .spyOn(sevenTvService, 'getPersonalEmoteSet')
    .mockResolvedValue([personalEmote]);

  await fetchUserPersonalEmotes('user-1', channelId);
}

beforeEach(() => {
  jest.restoreAllMocks();
  clearPersonalEmotesCache();
});

describe('resolveMessageEmoteParts subscriber scoping', () => {
  test('resolves the channel subscriber emotes when the sender is the current user', () => {
    const userstate = createUserStateFromTags(createChatTags({ login: 'me' }));

    const tokens = resolveMessageEmoteParts({
      channelId,
      emoteData: createEmoteData({ twitchSubscriberEmotes: [subscriberEmote] }),
      show7TvEmotes: true,
      text: 'own SubEmote',
      userId: 'user-1',
      userLogin: 'me',
      userstate,
    });

    expect(emoteTokens(tokens)).toEqual<EmoteTokenSummary[]>([
      { content: 'SubEmote', site: 'Twitch Subscriber' },
    ]);
  });

  test('leaves the channel subscriber emotes as text for other senders', () => {
    const userstate = createUserStateFromTags(
      createChatTags({ login: 'someone-else' }),
    );

    const tokens = resolveMessageEmoteParts({
      channelId,
      emoteData: createEmoteData({ twitchSubscriberEmotes: [subscriberEmote] }),
      show7TvEmotes: true,
      text: 'other SubEmote',
      userId: 'user-1',
      userLogin: 'me',
      userstate,
    });

    expect(emoteTokens(tokens)).toEqual<EmoteTokenSummary[]>([]);
  });
});

describe('resolveMessageEmoteParts personal emotes', () => {
  test('resolves the user personal emotes when 7TV emotes are enabled', async () => {
    await seedPersonalEmotes();
    const userstate = createUserStateFromTags(createChatTags({ login: 'me' }));

    const tokens = resolveMessageEmoteParts({
      channelId,
      emoteData: createEmoteData(),
      show7TvEmotes: true,
      text: 'enabled PersonalEmote',
      userId: 'user-1',
      userLogin: 'me',
      userstate,
    });

    expect(emoteTokens(tokens)).toEqual<EmoteTokenSummary[]>([
      { content: 'PersonalEmote', site: personalEmote.site },
    ]);
  });

  test('leaves personal emotes as text when 7TV emotes are disabled', async () => {
    await seedPersonalEmotes();
    const userstate = createUserStateFromTags(createChatTags({ login: 'me' }));

    const tokens = resolveMessageEmoteParts({
      channelId,
      emoteData: createEmoteData(),
      show7TvEmotes: false,
      text: 'disabled PersonalEmote',
      userId: 'user-1',
      userLogin: 'me',
      userstate,
    });

    expect(emoteTokens(tokens)).toEqual<EmoteTokenSummary[]>([]);
  });
});
