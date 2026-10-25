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
import { createUserStateFromTags } from '@app/utils/chat/message-handlers/createUserStateFromTags';
import type { MessageToken } from '@app/utils/chat/messageToken';

import { resolveMessageEmoteParts } from '../resolveMessageEmoteTokens';

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

  describe('resolveMessageEmoteParts chat GIFS', () => {
    const gifBody = '[Y A Y Yes GIF by Djemilah Birnie]';
    const gifUrl =
      'https://media4.giphy.com/media/joSNxeswxuc74Juo8X/giphy.gif?cid=095d7a5dzizsiwgabonagkmigggv8v1spfai91ac3x0dsiy0&ep=v1_gifs_trending&rid=giphy.gif&ct=g';
    const gifsTag = `0-33|joSNxeswxuc74Juo8X|${gifUrl}`;

    test('leaves GIF alt text as text when showChatGifs is off', () => {
      const userstate = createUserStateFromTags(
        createChatTags({ login: 'me', gifs: gifsTag }),
      );

      const tokens = resolveMessageEmoteParts({
        channelId,
        emoteData: createEmoteData(),
        show7TvEmotes: true,
        showChatGifs: false,
        text: gifBody,
        userId: 'user-1',
        userLogin: 'me',
        userstate,
      });

      expect(tokens.some(token => token.type === 'gif')).toBe(false);

      expect(
        tokens
          .map(token => (token.type === 'text' ? token.content : ''))
          .join(''),
      ).toBe(gifBody);
    });

    test('replaces the GIF span with a gif token when showChatGifs is on', () => {
      const userstate = createUserStateFromTags(
        createChatTags({ login: 'me', gifs: gifsTag }),
      );

      const tokens = resolveMessageEmoteParts({
        channelId,
        emoteData: createEmoteData(),
        show7TvEmotes: true,
        showChatGifs: true,
        text: gifBody,
        userId: 'user-1',
        userLogin: 'me',
        userstate,
      });

      expect(tokens).toEqual<MessageToken[]>([
        {
          type: 'gif',
          content: gifBody,
          gifId: 'joSNxeswxuc74Juo8X',
          url: gifUrl,
        },
      ]);
    });

    test('keeps surrounding text when a GIF sits mid-message', () => {
      const body = 'hello world!';
      const midGifTag = `6-10|abc123|${gifUrl}`;

      const userstate = createUserStateFromTags(
        createChatTags({ login: 'me', gifs: midGifTag }),
      );

      const tokens = resolveMessageEmoteParts({
        channelId,
        emoteData: createEmoteData(),
        show7TvEmotes: true,
        showChatGifs: true,
        text: body,
        userId: 'user-1',
        userLogin: 'me',
        userstate,
      });

      // processTextChunk splits trailing whitespace onto its own text token.
      expect(tokens).toEqual<MessageToken[]>([
        { type: 'text', content: 'hello' },
        { type: 'text', content: ' ' },
        {
          type: 'gif',
          content: 'world',
          gifId: 'abc123',
          url: gifUrl,
        },
        { type: 'text', content: '!' },
      ]);
    });
  });
});
