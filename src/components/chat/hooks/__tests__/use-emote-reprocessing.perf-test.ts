import { act, renderHook } from '@testing-library/react-native';
import { measureFunction } from 'reassure';

import { createSevenTvEmote } from '@app/components/chat/__tests__/__fixtures__/chatFactories.fixture';
import { useEmoteReprocessing } from '@app/components/chat/hooks/use-emote-reprocessing';
import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import { denseEmoteData } from '@app/store/chat/__fixtures__/resolveMessageEmoteTokens.perf.fixture';
import { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import { addMessages, clearMessages } from '@app/store/chat/actions/messages';
import * as personalEmotes from '@app/store/chat/actions/personal-emotes';
import { resolveMessageEmoteTokens } from '@app/store/chat/actions/resolveMessageEmoteTokens';
import { updateSevenTvEmotes } from '@app/store/chat/actions/seven-tv-channel-lifecycle';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { useChannelEmoteDataForReprocess } from '@app/store/chat/react/selectors';
import {
  makeEmptyEmoteData,
  makeEmptyGlobalCacheData,
} from '@app/store/chat/types/constants';
import { flushChatStoreTimers } from '@app/test/chat-store-teardown';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/user-state-tags.fixture';
import * as getChannelCheermotesModule from '@app/utils/chat/cheermote-store/getChannelCheermotes';

jest.spyOn(personalEmotes, 'getUserPersonalEmotes').mockReturnValue([]);

jest
  .spyOn(getChannelCheermotesModule, 'getChannelCheermotes')
  .mockReturnValue(undefined);

const channelId = 'perf-channel';
const WINDOW_SIZE = 150;
const AFFECTED_EVERY = 30;

const baseSevenTvEmotes = Array.from({ length: 40 }, (_, index) =>
  createSevenTvEmote({
    id: `stv-${index}`,
    name: `Stv${index}`,
    original_name: `Stv${index}`,
    url: `https://cdn.7tv.app/emote/stv-${index}/1x.webp`,
  }),
);

const addedEmote = createSevenTvEmote({
  id: 'stv-new',
  name: 'NewHype',
  original_name: 'NewHype',
  url: 'https://cdn.7tv.app/emote/stv-new/1x.webp',
});

const bttvNames = denseEmoteData.bttvChannelEmotes.map(emote => emote.name);
const twitchNames = denseEmoteData.twitchChannelEmotes.map(emote => emote.name);

function lineText(index: number, run: number): string {
  const bttv = bttvNames[index % bttvNames.length] ?? 'BTTV0';
  const twitch = twitchNames[(index * 3) % twitchNames.length] ?? 'Twitch0';
  const stv = baseSevenTvEmotes[index % baseSevenTvEmotes.length]?.name;

  if (index % AFFECTED_EVERY === 0) {
    return `run${run} NewHype NewHype ${stv} lets go`;
  }

  switch (index % 4) {
    case 0:
      return `run${run} just chatting about the game line ${index}`;
    case 1:
      return `run${run} ${bttv} ${stv} combo ${twitch}`;
    case 2:
      return `@viewer${index % 16} run${run} ${stv} you are right`;
    default:
      return `run${run} ${twitch} ${twitch} ${bttv} https://example.com/${index}`;
  }
}

function seedCaches() {
  chatStore$.persisted.globalCaches.set({
    ...makeEmptyGlobalCacheData(),
    twitchGlobalEmotes: denseEmoteData.twitchGlobalEmotes,
    bttvGlobalEmotes: denseEmoteData.bttvGlobalEmotes,
  });

  chatStore$.persisted.channelCaches.set({
    [channelId]: {
      ...makeEmptyEmoteData(),
      twitchChannelEmotes: denseEmoteData.twitchChannelEmotes,
      bttvChannelEmotes: denseEmoteData.bttvChannelEmotes,
      sevenTvChannelEmotes: baseSevenTvEmotes,
    },
  });
}

function buildCommittedWindow(run: number): AnyChatMessageType[] {
  const emoteData = getCurrentEmoteData(channelId);

  return Array.from({ length: WINDOW_SIZE }, (_, index) => {
    const login = `viewer${index % 16}`;
    const messageId = `run${run}-msg-${index}`;

    const userstate = createUserStateTags({
      'display-name': login,
      login,
      username: login,
      'user-id': `uid-${index % 40}`,
      id: messageId,
    });

    return createChatMessageFixture({
      id: messageId,
      message_id: messageId,
      message_nonce: `nonce-${messageId}`,
      sender: login,
      userstate,
      message: resolveMessageEmoteTokens({
        channelId,
        emoteData,
        show7TvEmotes: true,
        text: lineText(index, run),
        userId: userstate['user-id'],
        userLogin: 'luke',
        userstate,
      }),
    });
  });
}

function useReprocessHarness(processedMessageIds: Set<string>) {
  const channelEmoteData = useChannelEmoteDataForReprocess(channelId);

  useEmoteReprocessing({
    channelId,
    channelEmoteData,
    messages$: chatStore$.messages,
    emoteLoadStatus: 'success',
    processedMessageIdsRef: { current: processedMessageIds },
    reprocessKey: 'perf',
    show7TvEmotes: true,
    showChatGifs: false,
    userLogin: 'luke',
  });
}

describe('emote reprocess performance', () => {
  let run = 0;
  let unmount: (() => void) | null = null;

  beforeAll(() => {
    jest.useFakeTimers({ doNotFake: ['performance'] });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('applies one 7TV emote_set.update to a committed 150-row window', async () => {
    await measureFunction(
      () => {
        act(() => {
          updateSevenTvEmotes(channelId, [addedEmote], []);
        });

        act(() => {
          jest.runAllTimers();
        });
      },
      {
        runs: 10,
        warmupRuns: 2,
        beforeEach: () => {
          run += 1;
          clearMessages();
          seedCaches();

          const rendered = renderHook(() =>
            useReprocessHarness(new Set<string>()),
          );

          unmount = rendered.unmount;
          addMessages(buildCommittedWindow(run));
        },
        afterEach: () => {
          unmount?.();
          unmount = null;
          clearMessages();
          flushChatStoreTimers();
        },
      },
    );
  });
});
