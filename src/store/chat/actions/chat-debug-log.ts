import { getBadge, getPaint } from '@app/store/chat/actions/cosmetics';
import { getMessageSenderLogin } from '@app/store/chat/actions/messages';
import { getMissingBadgeIds } from '@app/store/chat/actions/missing-badges';
import { getChannelPersonalEmotes } from '@app/store/chat/actions/personal-emotes';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import {
  BADGE_SLICE_KEYS,
  type ChatResourceSliceKey,
  type ChatResourceSliceRecord,
  EMOTE_SLICE_KEYS,
  SLICE_BY_KEY,
  type SliceScope,
} from '@app/store/chat/types/chat-resource-slices';
import type { ChannelCacheType } from '@app/store/chat/types/constants';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import {
  type IrcMessage,
  parseIrcMessage,
} from '@app/utils/chat/irc-protocol/parseIrcMessage';

export interface ChatDebugIrcLine {
  line: string;
  receivedAt: number;
  dropped: boolean;
}

const MAX_DEBUG_IRC_LINES = 250;

const EMOTE_LOOKUP_PROVIDER_ORDER = ['7tv', 'bttv', 'ffz', 'twitch'] as const;

/**
 * Buffers key off the app channel id but inbound lines only carry the IRC
 * `#login`, so `channelIdsByLogin` bridges the two at record time.
 */
const recorderCounts = new Map<string, number>();

const channelIdsByLogin = new Map<string, string>();
const buffers = new Map<string, ChatDebugIrcLine[]>();

export function acquireChatDebugLog(
  channelId: string,
  channelName: string,
): void {
  recorderCounts.set(channelId, (recorderCounts.get(channelId) ?? 0) + 1);
  channelIdsByLogin.set(normaliseChatUsername(channelName), channelId);
}

export function releaseChatDebugLog(
  channelId: string,
  channelName: string,
): void {
  const next = (recorderCounts.get(channelId) ?? 1) - 1;

  if (next > 0) {
    recorderCounts.set(channelId, next);
    return;
  }

  recorderCounts.delete(channelId);
  buffers.delete(channelId);
  const login = normaliseChatUsername(channelName);

  if (channelIdsByLogin.get(login) === channelId) {
    channelIdsByLogin.delete(login);
  }
}

export function isChatDebugLogEnabled(): boolean {
  return recorderCounts.size > 0;
}

function getLineChannelLogin(message: IrcMessage | null): string | null {
  if (!message) {
    return null;
  }

  const { params } = message;
  const candidates = params.length > 1 ? params.slice(0, -1) : params;
  const channel = candidates.find(param => param.startsWith('#'));

  return channel ? normaliseChatUsername(channel.slice(1)) : null;
}

function appendToBuffer(channelId: string, entry: ChatDebugIrcLine): void {
  let buffer = buffers.get(channelId);

  if (!buffer) {
    buffer = [];
    buffers.set(channelId, buffer);
  }

  buffer.push(entry);

  if (buffer.length > MAX_DEBUG_IRC_LINES) {
    buffer.splice(0, buffer.length - MAX_DEBUG_IRC_LINES);
  }
}

export function recordChatDebugIrcLine(line: string, dropped = false): void {
  if (recorderCounts.size === 0) {
    return;
  }

  const entry: ChatDebugIrcLine = { line, receivedAt: Date.now(), dropped };
  const login = getLineChannelLogin(parseIrcMessage(line));

  const channelId = login === null ? undefined : channelIdsByLogin.get(login);

  if (channelId !== undefined) {
    appendToBuffer(channelId, entry);
    return;
  }

  if (login !== null) {
    return;
  }

  // Channel-less lines (auth numerics, GLOBALUSERSTATE) are socket-wide.
  for (const channelId of recorderCounts.keys()) {
    appendToBuffer(channelId, entry);
  }
}

export function getChatDebugIrcLines(channelId: string): ChatDebugIrcLine[] {
  return (buffers.get(channelId) ?? []).slice().reverse();
}

/**
 * Matches the sender prefix, the login tags and a CLEARCHAT target, never the
 * trailing text, so a user who types a login does not match.
 */
function isLineForLogin(line: string, target: string): boolean {
  const message = parseIrcMessage(line);

  if (!message) {
    return false;
  }

  const prefixLogin = message.prefix?.split('!')[0];
  const isClearChat = message.command === 'CLEARCHAT';

  return (
    normaliseChatUsername(prefixLogin) === target ||
    normaliseChatUsername(message.tags?.['login']) === target ||
    normaliseChatUsername(message.tags?.['display-name']) === target ||
    (isClearChat && normaliseChatUsername(message.params[1]) === target)
  );
}

export function getChatDebugIrcLinesForLogin(
  login: string | null | undefined,
  limit = 10,
): ChatDebugIrcLine[] {
  const target = normaliseChatUsername(login);

  if (!target) {
    return [];
  }

  const channelId = chatStore$.currentChannelId.peek();
  const lines = channelId ? (buffers.get(channelId) ?? []) : [];
  const matches: ChatDebugIrcLine[] = [];

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const entry = lines[index];

    if (!entry) {
      continue;
    }

    const isTargetLine = isLineForLogin(entry.line, target);

    if (isTargetLine) {
      matches.push(entry);
    }

    if (matches.length >= limit) {
      break;
    }
  }

  return matches;
}

function findLatestMessageFromLogin(target: string) {
  const messages = chatStore$.messages.peek();

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message && getMessageSenderLogin(message) === target) {
      return message;
    }
  }

  return undefined;
}

function getCurrentChannelCache() {
  const channelId = chatStore$.currentChannelId.peek();

  if (!channelId) {
    return { channelId: null, cache: undefined };
  }

  return {
    channelId,
    cache: chatStore$.persisted.channelCaches[channelId]?.peek(),
  };
}

function formatCacheAge(lastUpdated: number | undefined): string {
  return lastUpdated ? new Date(lastUpdated).toISOString() : 'never';
}

interface ChatDebugCacheMiss {
  channelId: string | null;
  cacheLoaded: false;
}

type EmoteSliceKey = ChatResourceSliceKey<SliceScope, 'emote'>;
type BadgeSliceKey = ChatResourceSliceKey<SliceScope, 'badge'>;

interface ChatDebugEmoteSources extends Record<EmoteSliceKey, number> {
  channelId: string | null;
  lastUpdated: string;
  sevenTvUpdatedAt: string;
  globalsLastUpdated: string;
  sevenTvEmoteSetId: string | null;
  sevenTvPersonalUsers: number;
}

function readSlices(cache: ChannelCacheType) {
  return { ...cache, ...chatStore$.persisted.globalCaches.peek() };
}

function countSlices<TKey extends ChatResourceSliceKey>(
  keys: readonly TKey[],
  slices: ChatResourceSliceRecord<TKey>,
): Record<TKey, number> {
  // SAFETY: the entries hold one count for each key in `keys`.
  return Object.fromEntries(
    keys.map(key => [key, slices[key].length]),
  ) as Record<TKey, number>;
}

export function getChatDebugEmoteSources():
  | ChatDebugEmoteSources
  | ChatDebugCacheMiss {
  const { channelId, cache } = getCurrentChannelCache();

  if (!cache) {
    return { channelId, cacheLoaded: false };
  }

  const globalCaches = chatStore$.persisted.globalCaches.peek();

  return {
    channelId,
    lastUpdated: formatCacheAge(cache.lastUpdated),
    sevenTvUpdatedAt: formatCacheAge(cache.sevenTvUpdatedAt),
    globalsLastUpdated: formatCacheAge(globalCaches.lastUpdated),
    sevenTvEmoteSetId: cache.sevenTvEmoteSetId ?? null,
    sevenTvPersonalUsers: Object.keys(getChannelPersonalEmotes(channelId))
      .length,
    ...countSlices(EMOTE_SLICE_KEYS, readSlices(cache)),
  };
}

interface ChatDebugEmoteMatch {
  foundInCache: true;
  sourceList: string;
  cachedEmote: SanitisedEmote;
}

interface ChatDebugEmoteLookupMiss {
  foundInCache: false;
  cacheLoaded: boolean;
}

export function getChatDebugEmoteDetails(emote: {
  id?: string;
  name?: string;
}): ChatDebugEmoteMatch | ChatDebugEmoteLookupMiss {
  const { channelId, cache } = getCurrentChannelCache();

  if (!cache) {
    return { foundInCache: false, cacheLoaded: false };
  }

  const slices = readSlices(cache);

  const personalLists = Object.entries(getChannelPersonalEmotes(channelId)).map(
    ([ownerId, emotes]): [string, SanitisedEmote[]] => [
      `sevenTvPersonal:${ownerId}`,
      emotes,
    ],
  );

  const lists = EMOTE_LOOKUP_PROVIDER_ORDER.flatMap(provider => [
    ...EMOTE_SLICE_KEYS.flatMap((key): [string, SanitisedEmote[]][] =>
      SLICE_BY_KEY[key].provider === provider ? [[key, slices[key]]] : [],
    ),
    ...(provider === '7tv' ? personalLists : []),
  ]);

  let nameMatch: ChatDebugEmoteMatch | undefined;

  for (const [sourceList, emotes] of lists) {
    for (const cachedEmote of emotes) {
      if (emote.id && cachedEmote.id === emote.id) {
        return { foundInCache: true, sourceList, cachedEmote };
      }

      if (!nameMatch && emote.name && cachedEmote.name === emote.name) {
        nameMatch = { foundInCache: true, sourceList, cachedEmote };
      }
    }
  }

  return nameMatch ?? { foundInCache: false, cacheLoaded: true };
}

interface ChatDebugSevenTvBadgeDetails {
  provider: '7tv';
  definitionLoaded: boolean;
  definition: SanitisedBadgeSet | null;
  wearerCount: number;
  isMissingDefinition: boolean;
}

interface ChatDebugBadgeProviderDetails {
  provider: SanitisedBadgeSet['provider'];
}

export function getChatDebugBadgeDetails(
  badge: SanitisedBadgeSet,
): ChatDebugSevenTvBadgeDetails | ChatDebugBadgeProviderDetails {
  if (badge.provider !== '7tv') {
    return { provider: badge.provider };
  }

  const definition = chatStore$.badges[badge.id]?.peek();

  const wearerCount = Object.values(chatStore$.userBadgeIds.peek()).filter(
    badgeId => badgeId === badge.id,
  ).length;

  return {
    provider: '7tv',
    definitionLoaded: Boolean(definition),
    definition: definition ?? null,
    wearerCount,
    isMissingDefinition: getMissingBadgeIds().includes(badge.id),
  };
}

interface ChatDebugBadgeSources extends Record<BadgeSliceKey, number> {
  channelId: string | null;
  badgesLastUpdated: string;
  globalsLastUpdated: string;
  sevenTvBadgeDefinitions: number;
  sevenTvBadgeWearers: number;
  missingSevenTvBadgeIds: string[];
}

export function getChatDebugBadgeSources():
  | ChatDebugBadgeSources
  | ChatDebugCacheMiss {
  const { channelId, cache } = getCurrentChannelCache();

  if (!cache) {
    return { channelId, cacheLoaded: false };
  }

  return {
    channelId,
    badgesLastUpdated: formatCacheAge(cache.badgesLastUpdated),
    globalsLastUpdated: formatCacheAge(
      chatStore$.persisted.globalCaches.lastUpdated.peek(),
    ),
    ...countSlices(BADGE_SLICE_KEYS, readSlices(cache)),
    sevenTvBadgeDefinitions: Object.keys(chatStore$.badges.peek()).length,
    sevenTvBadgeWearers: Object.keys(chatStore$.userBadgeIds.peek()).length,
    missingSevenTvBadgeIds: getMissingBadgeIds(),
  };
}

interface ChatDebugResolvedBadge {
  id: string;
  set: string;
  title: string;
  type: SanitisedBadgeSet['type'];
  provider: SanitisedBadgeSet['provider'];
  url: string;
}

interface ChatDebugLatestMessage {
  messageId: string;
  resolvedBadges: ChatDebugResolvedBadge[];
  userstate: AnyChatMessageType['userstate'];
}

type ChatDebugUserSnapshot = {
  login: string | null;
  userId: string | null;
  sevenTvPaintId: string | null;
  sevenTvPaintName: string | null;
  sevenTvBadgeId: string | null;
  sevenTvBadgeTitle: string | null;
  sevenTvPersonalEmotes: string[];
  latestMessage: ChatDebugLatestMessage | null;
};

export function getChatDebugUserSnapshot(
  login: string | null | undefined,
  username: string | null | undefined,
  userId: string | null | undefined,
): ChatDebugUserSnapshot {
  const target =
    normaliseChatUsername(login) || normaliseChatUsername(username);

  const paintId = userId
    ? (chatStore$.userPaintIds[userId]?.peek() ?? null)
    : null;

  const badgeId = userId
    ? (chatStore$.userBadgeIds[userId]?.peek() ?? null)
    : null;

  const latestMessage = target ? findLatestMessageFromLogin(target) : undefined;

  const { channelId } = getCurrentChannelCache();

  const personalEmotes = userId
    ? (getChannelPersonalEmotes(channelId)[userId] ?? [])
    : [];

  return {
    login: target || null,
    userId: userId ?? null,
    sevenTvPaintId: paintId,
    sevenTvPaintName: paintId ? (getPaint(paintId)?.name ?? null) : null,
    sevenTvBadgeId: badgeId,
    sevenTvBadgeTitle: badgeId ? (getBadge(badgeId)?.title ?? null) : null,
    sevenTvPersonalEmotes: personalEmotes.map(emote => emote.name),
    latestMessage: latestMessage
      ? {
          messageId: latestMessage.message_id,
          resolvedBadges: latestMessage.badges.map(badge => ({
            id: badge.id,
            set: badge.set,
            title: badge.title,
            type: badge.type,
            provider: badge.provider ?? 'twitch',
            url: badge.url,
          })),
          userstate: latestMessage.userstate,
        }
      : null,
  };
}
