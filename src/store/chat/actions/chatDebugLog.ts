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

export function getChatDebugIrcLinesForLogin(
  login: string | null | undefined,
  limit = 10,
): ChatDebugIrcLine[] {
  const target = normaliseChatUsername(login);
  if (!target) {
    return [];
  }
  const escaped = target.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
  const tagPattern = new RegExp(`[@;](?:login|display-name)=${escaped}(?:;| )`);

  const matches: ChatDebugIrcLine[] = [];
  for (let index = ircLines.length - 1; index >= 0; index -= 1) {
    const entry = ircLines[index];
    if (!entry) {
      continue;
    }
    const line = entry.line.toLowerCase();
    if (
      line.includes(`!${target}@`) ||
      tagPattern.test(line) ||
      (line.includes(' clearchat ') && line.endsWith(`:${target}`))
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

  type Found = {
    foundInCache: true;
    sourceList: string;
    cachedEmote: SanitisedEmote;
  };
  const byId = new Map<string, Found>();
  const byName = new Map<string, Found>();
  for (const [sourceList, emotes] of lists) {
    for (const cachedEmote of emotes) {
      const found: Found = { foundInCache: true, sourceList, cachedEmote };
      if (!byId.has(cachedEmote.id)) {
        byId.set(cachedEmote.id, found);
      }
      if (!byName.has(cachedEmote.name)) {
        byName.set(cachedEmote.name, found);
      }
    }
  }

  return (
    (emote.id ? byId.get(emote.id) : undefined) ??
    (emote.name ? byName.get(emote.name) : undefined) ?? {
      foundInCache: false,
      cacheLoaded: true,
    }
  );
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
