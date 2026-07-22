import { renderHook } from '@testing-library/react-native';

import { resolveMessageEmoteParts } from '@app/components/Chat/util/resolveMessageEmoteParts';
import {
  getCurrentEmoteData,
  getUserPersonalEmotes,
} from '@app/store/chat/actions/channelLoad';
import { updateMessages } from '@app/store/chat/actions/messages';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { useEmoteReprocessing } from '../useEmoteReprocessing';
import {
  createEmoteData,
  createSevenTvEmote,
} from './__fixtures__/useChat.fixture';

// The whole point of this suite is to exercise the real resolver + emote
// worklet, so neither is mocked - only the store-backed emote sources are.
jest.mock('@app/store/chat/actions/channelLoad', () => ({
  getCurrentEmoteData: jest.fn(),
  getUserPersonalEmotes: jest.fn(() => []),
}));
jest.mock('@app/store/chat/actions/messages', () => ({
  updateMessages: jest.fn(),
}));
jest.mock('@app/store/chat/observables/chatStore', () => ({
  chatStore$: {
    emojis: {
      peek: jest.fn(() => []),
    },
  },
}));
jest.mock('@app/utils/chat/findBadges', () => ({
  findBadges: jest.fn(() => []),
}));

const mockGetCurrentEmoteData = jest.mocked(getCurrentEmoteData);
const mockGetUserPersonalEmotes = jest.mocked(getUserPersonalEmotes);
const mockUpdateMessages = jest.mocked(updateMessages);

const channelId = 'channel-1';

// Only used to keep the reprocess gate open in the 7TV-disabled case below;
// `plaska` itself always resolves via the personal set, never this emote.
const channelKappa = createSevenTvEmote({ id: 'kappa', name: 'Kappa' });
const personalPlaska = createSevenTvEmote({
  id: 'plaska-id',
  name: 'plaska',
  original_name: 'plaska',
  url: 'https://cdn.example.test/plaska.webp',
  static_url: 'https://cdn.example.test/plaska.png',
});

const senderUserstate = createUserStateTags({
  'display-name': 'chatter',
  login: 'chatter',
  username: 'chatter',
  'user-id': 'sender-1',
  id: 'm1',
  color: '#fff',
});

function createMessage(
  parts: ParsedPart[],
  messageId = 'm1',
): AnyChatMessageType {
  return {
    id: messageId,
    message_id: messageId,
    message_nonce: 'n1',
    message: parts,
    channel: 'test',
    sender: 'chatter',
    badges: [],
    userstate: senderUserstate,
    parentDisplayName: '',
    replyDisplayName: '',
    replyBody: '',
  };
}

function renderReprocess(
  message: AnyChatMessageType,
  overrides: { show7TvEmotes?: boolean } = {},
) {
  const processedMessageIdsRef = { current: new Set<string>() };
  renderHook(() =>
    useEmoteReprocessing({
      channelId,
      channelEmoteData: {},
      messages$: { peek: () => [message] },
      emoteLoadStatus: 'success',
      processedMessageIdsRef,
      show7TvEmotes: overrides.show7TvEmotes ?? true,
      userLogin: 'me',
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  // Empty channel emote data: `plaska` is reachable only via the personal set,
  // so these tests also prove a personal-emote-only channel still reprocesses.
  mockGetCurrentEmoteData.mockReturnValue(createEmoteData());
  mockGetUserPersonalEmotes.mockReturnValue([personalPlaska]);
});

/**
 * Resolves `text` the same way live ingest does, so a test can seed a message
 * with the parts it would have had when it first arrived.
 */
function ingestParts(text: string): ParsedPart[] {
  return resolveMessageEmoteParts({
    channelId,
    emoteData: createEmoteData(),
    show7TvEmotes: true,
    text,
    userId: 'sender-1',
    userLogin: 'me',
    userstate: senderUserstate,
  });
}

/**
 * Reduces parts to the fields these tests assert on so the shape can be
 * compared with `toEqual` instead of a partial matcher.
 */
function partShapes(parts: ParsedPart[]): { type: string; id?: string }[] {
  return parts.map(part => ({
    type: part.type,
    id: 'id' in part ? part.id : undefined,
  }));
}

function updatedMessage(): ParsedPart[] {
  return mockUpdateMessages.mock.calls[0]?.[0]?.[0]?.updates
    ?.message as ParsedPart[];
}

describe('useEmoteReprocessing personal 7TV emotes', () => {
  test('seeds a message where `plaska` resolves to the personal emote', () => {
    expect(partShapes(ingestParts('plaska'))).toEqual([
      { type: 'emote', id: 'plaska-id' },
    ]);
  });

  test('keeps a resolved personal emote as an emote on reprocess (no text downgrade)', () => {
    // Message arrived already resolved to the personal emote on ingest.
    renderReprocess(createMessage(ingestParts('plaska')));

    // The reprocess pass must re-resolve `plaska` via the personal set and leave
    // the emote untouched - never rewrite it back to a plain "plaska" text part.
    expect(mockGetUserPersonalEmotes).toHaveBeenCalledWith(
      'sender-1',
      channelId,
    );
    expect(mockUpdateMessages).not.toHaveBeenCalled();
  });

  test('upgrades a text-only message to the personal emote once it is available', () => {
    // Message arrived as text (personal set not loaded yet), then reprocess runs.
    renderReprocess(createMessage([{ type: 'text', content: 'plaska' }]));

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
    expect(partShapes(updatedMessage())).toEqual([
      { type: 'emote', id: 'plaska-id' },
    ]);
  });

  test('downgrades to text only when 7TV emotes are turned off', () => {
    /**
     * With the toggle off the personal set is intentionally dropped, so the
     * emote falls back to text. A channel emote keeps the reprocess gate open
     * (7TV off no longer holds it open on its own) so the resolver still runs.
     */
    mockGetCurrentEmoteData.mockReturnValue(
      createEmoteData({ sevenTvChannelEmotes: [channelKappa] }),
    );
    renderReprocess(createMessage(ingestParts('plaska')), {
      show7TvEmotes: false,
    });

    expect(mockUpdateMessages).toHaveBeenCalledTimes(1);
    expect(updatedMessage()).toEqual([{ type: 'text', content: 'plaska' }]);
  });
});
