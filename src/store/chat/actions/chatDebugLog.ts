import { getBadge, getPaint } from '@app/store/chat/actions/cosmetics';
import { getMissingBadgeIds } from '@app/store/chat/actions/missingBadges';
import { getChannelPersonalEmotes } from '@app/store/chat/actions/personalEmotes';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';

export interface ChatDebugIrcLine {
  line: string;
  receivedAt: number;
  dropped: boolean;
}

const MAX_DEBUG_IRC_LINES = 250;

/**
 * Captures are scoped per channel so stacked stream screens cannot wipe or
 * pollute each other's buffer. Buffers key off the app channel id (what
 * `chatStore$.currentChannelId` holds) but inbound lines only carry the IRC
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

function getLineChannelLogin(line: string): string | null {
  const { rest } = splitIrcLine(line);
  const hashIndex = rest.indexOf('#');
  if (hashIndex === -1) {
    return null;
  }
  const end = rest.indexOf(' ', hashIndex);
  return rest.slice(hashIndex + 1, end === -1 ? undefined : end).toLowerCase();
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
  const login = getLineChannelLogin(line);
  if (login !== null) {
    const channelId = channelIdsByLogin.get(login);
    if (channelId !== undefined) {
      appendToBuffer(channelId, entry);
    }
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
 * User-typed text reaches a line in two places: the trailing parameter (the
 * message body) and tag values like reply-parent-msg-body. Tag values escape
 * raw ';' and space, so the tags token ends at the first space and real tags
 * always split on ';', which lets the login matchers anchor to real tag keys
 * and the sender prefix instead of user-typed lookalikes.
 */
function splitIrcLine(line: string): {
  tags: string | null;
  prefix: string | null;
  rest: string;
  trailing: string | null;
} {
  let cursor = 0;
  let tags: string | null = null;
  if (line.startsWith('@')) {
    const tagEnd = line.indexOf(' ');
    if (tagEnd === -1) {
      return { tags: line, prefix: null, rest: '', trailing: null };
    }
    tags = line.slice(0, tagEnd);
    cursor = tagEnd + 1;
  }
  let prefix: string | null = null;
  if (line.startsWith(':', cursor)) {
    const prefixEnd = line.indexOf(' ', cursor);
    if (prefixEnd === -1) {
      return { tags, prefix: line.slice(cursor), rest: '', trailing: null };
    }
    prefix = line.slice(cursor, prefixEnd);
    cursor = prefixEnd + 1;
  }
  const trailingStart = line.indexOf(' :', cursor);
  if (trailingStart === -1) {
    return { tags, prefix, rest: line.slice(cursor), trailing: null };
  }
  return {
    tags,
    prefix,
    rest: line.slice(cursor, trailingStart),
    trailing: line.slice(trailingStart + 2),
  };
}

export function getChatDebugIrcLinesForLogin(
  login: string | null | undefined,
  limit = 10,
): ChatDebugIrcLine[] {
  const target = normaliseChatUsername(login);
  if (!target) {
    return [];
  }
  const escaped = target
    .replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')
    .replace(/ /g, '\\\\s');
  const tagPattern = new RegExp(
    `(?:^@|;)(?:login|display-name)=${escaped}(?:;|$)`,
  );

  const channelId = chatStore$.currentChannelId.peek();
  const lines = channelId ? (buffers.get(channelId) ?? []) : [];
  const matches: ChatDebugIrcLine[] = [];
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const entry = lines[index];
    if (!entry) {
      continue;
    }
    const { tags, prefix, rest, trailing } = splitIrcLine(
      entry.line.toLowerCase(),
    );
    if (
      prefix?.startsWith(`:${target}!`) ||
      (tags !== null && tagPattern.test(tags)) ||
      (rest.startsWith('clearchat ') && trailing === target)
    ) {
      matches.push(entry);
      if (matches.length >= limit) {
        break;
      }
    }
  }
  return matches;
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

export function getChatDebugEmoteSources(): Record<string, unknown> {
  const { channelId, cache } = getCurrentChannelCache();
  if (!cache) {
    return { channelId, cacheLoaded: false };
  }
  const globalCaches = chatStore$.persisted.globalCaches.peek();
  return {
    channelId,
    lastUpdated: formatCacheAge(cache.lastUpdated),
    globalsLastUpdated: formatCacheAge(globalCaches.lastUpdated),
    sevenTvEmoteSetId: cache.sevenTvEmoteSetId ?? null,
    twitchChannel: cache.twitchChannelEmotes.length,
    twitchGlobal: globalCaches.twitchGlobalEmotes.length,
    twitchSubscriber: cache.twitchSubscriberEmotes.length,
    sevenTvChannel: cache.sevenTvChannelEmotes.length,
    sevenTvGlobal: globalCaches.sevenTvGlobalEmotes.length,
    sevenTvPersonalUsers: Object.keys(getChannelPersonalEmotes(channelId))
      .length,
    bttvChannel: cache.bttvChannelEmotes.length,
    bttvGlobal: globalCaches.bttvGlobalEmotes.length,
    ffzChannel: cache.ffzChannelEmotes.length,
    ffzGlobal: globalCaches.ffzGlobalEmotes.length,
  };
}

export function getChatDebugEmoteDetails(emote: {
  id?: string;
  name?: string;
}): Record<string, unknown> {
  const { channelId, cache } = getCurrentChannelCache();
  if (!cache) {
    return { foundInCache: false, cacheLoaded: false };
  }

  const globalCaches = chatStore$.persisted.globalCaches.peek();
  const lists: [string, SanitisedEmote[]][] = [
    ['sevenTvChannel', cache.sevenTvChannelEmotes],
    ['sevenTvGlobal', globalCaches.sevenTvGlobalEmotes],
    ...Object.entries(getChannelPersonalEmotes(channelId)).map(
      ([ownerId, emotes]): [string, SanitisedEmote[]] => [
        `sevenTvPersonal:${ownerId}`,
        emotes,
      ],
    ),
    ['bttvChannel', cache.bttvChannelEmotes],
    ['bttvGlobal', globalCaches.bttvGlobalEmotes],
    ['ffzChannel', cache.ffzChannelEmotes],
    ['ffzGlobal', globalCaches.ffzGlobalEmotes],
    ['twitchChannel', cache.twitchChannelEmotes],
    ['twitchGlobal', globalCaches.twitchGlobalEmotes],
    ['twitchSubscriber', cache.twitchSubscriberEmotes],
  ];

  let nameMatch: Record<string, unknown> | undefined;
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

export function getChatDebugBadgeDetails(
  badge: SanitisedBadgeSet,
): Record<string, unknown> {
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

export function getChatDebugBadgeSources(): Record<string, unknown> {
  const { channelId, cache } = getCurrentChannelCache();
  if (!cache) {
    return { channelId, cacheLoaded: false };
  }
  const globalCaches = chatStore$.persisted.globalCaches.peek();
  return {
    channelId,
    badgesLastUpdated: formatCacheAge(cache.badgesLastUpdated),
    globalsLastUpdated: formatCacheAge(globalCaches.lastUpdated),
    twitchChannel: cache.twitchChannelBadges.length,
    twitchGlobal: globalCaches.twitchGlobalBadges.length,
    ffzChannel: cache.ffzChannelBadges.length,
    ffzGlobal: globalCaches.ffzGlobalBadges.length,
    sevenTvBadgeDefinitions: Object.keys(chatStore$.badges.peek()).length,
    sevenTvBadgeWearers: Object.keys(chatStore$.userBadgeIds.peek()).length,
    missingSevenTvBadgeIds: getMissingBadgeIds(),
  };
}

export function getChatDebugUserSnapshot(
  login: string | null | undefined,
  username: string | null | undefined,
  userId: string | null | undefined,
): Record<string, unknown> {
  const target =
    normaliseChatUsername(login) || normaliseChatUsername(username);

  const paintId = userId
    ? (chatStore$.userPaintIds[userId]?.peek() ?? null)
    : null;
  const badgeId = userId
    ? (chatStore$.userBadgeIds[userId]?.peek() ?? null)
    : null;

  let latestMessage;
  if (target) {
    const messages = chatStore$.messages.peek();
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (!message) {
        continue;
      }
      const messageLogin = normaliseChatUsername(
        message.userstate?.login ||
          message.userstate?.username ||
          message.sender,
      );
      if (messageLogin === target) {
        latestMessage = message;
        break;
      }
    }
  }

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
