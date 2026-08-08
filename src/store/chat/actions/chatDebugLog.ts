import { getBadge, getPaint } from '@app/store/chat/actions/cosmetics';
import { getMissingBadgeIds } from '@app/store/chat/actions/missingBadges';
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

let activeRecorders = 0;
const ircLines: ChatDebugIrcLine[] = [];

export function acquireChatDebugLog(): void {
  activeRecorders += 1;
}

export function releaseChatDebugLog(): void {
  activeRecorders = Math.max(0, activeRecorders - 1);
  if (activeRecorders === 0) {
    ircLines.length = 0;
  }
}

export function isChatDebugLogEnabled(): boolean {
  return activeRecorders > 0;
}

export function recordChatDebugIrcLine(line: string, dropped = false): void {
  if (activeRecorders === 0) {
    return;
  }
  ircLines.push({ line, receivedAt: Date.now(), dropped });
  if (ircLines.length > MAX_DEBUG_IRC_LINES) {
    ircLines.splice(0, ircLines.length - MAX_DEBUG_IRC_LINES);
  }
}

export function clearChatDebugLog(): void {
  ircLines.length = 0;
}

export function getChatDebugIrcLines(): ChatDebugIrcLine[] {
  return ircLines.slice().reverse();
}

/**
 * User-typed text reaches a line in two places: the trailing parameter (the
 * message body) and tag values like reply-parent-msg-body. Tag values escape
 * raw ';' and space, so the tags token ends at the first space and real tags
 * always split on ';'. That keeps the matchers below anchored to actual tag
 * keys and the sender prefix instead of firing on lookalike text inside a
 * body.
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

  const matches: ChatDebugIrcLine[] = [];
  for (let index = ircLines.length - 1; index >= 0; index -= 1) {
    const entry = ircLines[index];
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
  return {
    channelId,
    lastUpdated: formatCacheAge(cache.lastUpdated),
    sevenTvEmoteSetId: cache.sevenTvEmoteSetId ?? null,
    twitchChannel: cache.twitchChannelEmotes.length,
    twitchGlobal: cache.twitchGlobalEmotes.length,
    twitchSubscriber: cache.twitchSubscriberEmotes.length,
    sevenTvChannel: cache.sevenTvChannelEmotes.length,
    sevenTvGlobal: cache.sevenTvGlobalEmotes.length,
    sevenTvPersonalUsers: Object.keys(cache.sevenTvPersonalEmotes).length,
    bttvChannel: cache.bttvChannelEmotes.length,
    bttvGlobal: cache.bttvGlobalEmotes.length,
    ffzChannel: cache.ffzChannelEmotes.length,
    ffzGlobal: cache.ffzGlobalEmotes.length,
  };
}

export function getChatDebugEmoteDetails(emote: {
  id?: string;
  name?: string;
}): Record<string, unknown> {
  const { cache } = getCurrentChannelCache();
  if (!cache) {
    return { foundInCache: false, cacheLoaded: false };
  }

  const lists: [string, SanitisedEmote[]][] = [
    ['sevenTvChannel', cache.sevenTvChannelEmotes],
    ['sevenTvGlobal', cache.sevenTvGlobalEmotes],
    ...Object.entries(cache.sevenTvPersonalEmotes).map(
      ([ownerId, emotes]): [string, SanitisedEmote[]] => [
        `sevenTvPersonal:${ownerId}`,
        emotes,
      ],
    ),
    ['bttvChannel', cache.bttvChannelEmotes],
    ['bttvGlobal', cache.bttvGlobalEmotes],
    ['ffzChannel', cache.ffzChannelEmotes],
    ['ffzGlobal', cache.ffzGlobalEmotes],
    ['twitchChannel', cache.twitchChannelEmotes],
    ['twitchGlobal', cache.twitchGlobalEmotes],
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
    return { provider: badge.provider ?? 'twitch' };
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
  return {
    channelId,
    badgesLastUpdated: formatCacheAge(cache.badgesLastUpdated),
    twitchChannel: cache.twitchChannelBadges.length,
    twitchGlobal: cache.twitchGlobalBadges.length,
    ffzChannel: cache.ffzChannelBadges.length,
    ffzGlobal: cache.ffzGlobalBadges.length,
    sevenTvPersonalUsers: Object.keys(cache.sevenTvPersonalBadges).length,
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

  const { cache } = getCurrentChannelCache();
  const personalEmotes =
    userId && cache ? (cache.sevenTvPersonalEmotes[userId] ?? []) : [];
  const personalBadges =
    userId && cache ? (cache.sevenTvPersonalBadges[userId] ?? []) : [];

  return {
    login: target || null,
    userId: userId ?? null,
    sevenTvPaintId: paintId,
    sevenTvPaintName: paintId ? (getPaint(paintId)?.name ?? null) : null,
    sevenTvBadgeId: badgeId,
    sevenTvBadgeTitle: badgeId ? (getBadge(badgeId)?.title ?? null) : null,
    sevenTvPersonalEmotes: personalEmotes.map(emote => emote.name),
    sevenTvPersonalBadges: personalBadges.map(badge => badge.title),
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
