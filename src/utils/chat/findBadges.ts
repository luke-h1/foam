import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { normalizeSevenTvBadge } from '@app/utils/seven-tv/cosmetics/normalizeSevenTvBadge';

interface FindBadgesParams {
  userstate: UserStateTags;
  twitchChannelBadges: SanitisedBadgeSet[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  bttvBadges: SanitisedBadgeSet[];
  chatterinoBadges: SanitisedBadgeSet[];
  /**
   * The 7TV entitlement lookup reads live store state that entitlement events
   * invalidate, so only the part from the badge tag is cached.
   */
  getEntitledBadge: (userId: string) => SanitisedBadgeSet | null | undefined;
}

const hasBadge = (
  badges: SanitisedBadgeSet[],
  badge: SanitisedBadgeSet,
): boolean =>
  badges.some(
    existing => existing.id === badge.id && existing.set === badge.set,
  );

const addBadgeIfMissing = (
  badges: SanitisedBadgeSet[],
  badge: SanitisedBadgeSet,
): void => {
  const normalizedBadge = normalizeSevenTvBadge(badge);

  if (!normalizedBadge.url?.trim()) {
    return;
  }

  if (!hasBadge(badges, normalizedBadge)) {
    badges.push(normalizedBadge);
  }
};

const addBadge = (
  badges: SanitisedBadgeSet[],
  badge: SanitisedBadgeSet,
  fallbackType: SanitisedBadgeSet['type'],
): void => {
  const normalizedBadge = normalizeSevenTvBadge(badge);

  if (!normalizedBadge.url?.trim()) {
    return;
  }

  if (hasBadge(badges, normalizedBadge)) {
    return;
  }

  badges.push({
    title: normalizedBadge.title,
    url: normalizedBadge.url,
    type: normalizedBadge.type || fallbackType,
    set: normalizedBadge.set || '',
    id: normalizedBadge.id,
    color: normalizedBadge.color,
    owner_username: normalizedBadge.owner_username,
    provider: normalizedBadge.provider,
  });
};

const getRawTwitchBadges = (userstate: UserStateTags): string => {
  const sourceBadges = userstate['source-badges'];

  if (sourceBadges && sourceBadges.length > 0) {
    return sourceBadges;
  }

  return userstate['badges-raw'] || '';
};

/**
 * Builds an index once per badge array and keeps it on a WeakMap keyed by that
 * array. Each per-message lookup is then one Map hit, not a scan over
 * thousands of entries.
 */
const memoisedBadgeIndex = <TValue>(
  build: (badges: SanitisedBadgeSet[]) => Map<string, TValue>,
) => {
  const cache = new WeakMap<SanitisedBadgeSet[], ReadonlyMap<string, TValue>>();

  return (badges: SanitisedBadgeSet[]): ReadonlyMap<string, TValue> => {
    const cached = cache.get(badges);

    if (cached) {
      return cached;
    }

    const index = build(badges);
    cache.set(badges, index);
    return index;
  };
};

/**
 * Keyed by `set/id`, first badge of each key wins.
 */
const getBadgeSetIndex = memoisedBadgeIndex(badges => {
  const map = new Map<string, SanitisedBadgeSet>();

  for (const badge of badges) {
    const key = `${badge.set}/${badge.id}`;

    if (!map.has(key)) {
      map.set(key, badge);
    }
  }

  return map;
});

/**
 * Keyed by badge id, which for BTTV and Chatterino is the Twitch user id.
 */
const getBadgeUserIdIndex = memoisedBadgeIndex(badges => {
  const map = new Map<string, SanitisedBadgeSet>();

  for (const badge of badges) {
    if (!map.has(badge.id)) {
      map.set(badge.id, badge);
    }
  }

  return map;
});

const getBadgeOwnerIndex = memoisedBadgeIndex(badges => {
  const map = new Map<string, SanitisedBadgeSet[]>();

  for (const badge of badges) {
    const owner = normaliseChatUsername(badge.owner_username);

    if (!owner) {
      continue;
    }

    const existing = map.get(owner) ?? [];
    existing.push(badge);
    map.set(owner, existing);
  }

  return map;
});

const findTwitchChannelBadge = (
  twitchChannelBadges: SanitisedBadgeSet[],
  set: string,
  version: string,
): SanitisedBadgeSet | undefined =>
  getBadgeSetIndex(twitchChannelBadges).get(`${set}/${version}`);

const findTwitchGlobalBadge = (
  twitchGlobalBadges: SanitisedBadgeSet[],
  set: string,
  version: string,
): SanitisedBadgeSet | undefined =>
  getBadgeSetIndex(twitchGlobalBadges).get(`${set}/${set}_${version}`);

/**
 * The Twitch badges depend only on the badge tag and three collections, and a
 * chatter sends the same tag on every message. Two generations, the same as
 * the emote parse cache in `emoteProcessor.ts`.
 */
const TAG_BADGE_CACHE_GENERATION_SIZE = 256;

let tagBadgeCache = new Map<string, SanitisedBadgeSet[]>();
let previousTagBadgeCache = new Map<string, SanitisedBadgeSet[]>();
let tagBadgeCollections: SanitisedBadgeSet[][] = [];

function syncTagBadgeCollections(
  twitchChannelBadges: SanitisedBadgeSet[],
  twitchGlobalBadges: SanitisedBadgeSet[],
  ffzChannelBadges: SanitisedBadgeSet[],
): void {
  if (
    tagBadgeCollections[0] === twitchChannelBadges &&
    tagBadgeCollections[1] === twitchGlobalBadges &&
    tagBadgeCollections[2] === ffzChannelBadges
  ) {
    return;
  }

  tagBadgeCollections = [
    twitchChannelBadges,
    twitchGlobalBadges,
    ffzChannelBadges,
  ];

  tagBadgeCache = new Map();
  previousTagBadgeCache = new Map();
}

function buildTagBadges(
  rawTwitchBadges: string,
  twitchChannelBadges: SanitisedBadgeSet[],
  twitchGlobalBadges: SanitisedBadgeSet[],
  ffzChannelBadges: SanitisedBadgeSet[],
): SanitisedBadgeSet[] {
  const badges: SanitisedBadgeSet[] = [];

  // Custom FFZ channel art overrides the default Twitch mod/VIP badge.
  const ffzChannelBadgeIndex = getBadgeSetIndex(ffzChannelBadges);

  const ffzModBadge = ffzChannelBadgeIndex.get('mod/mod_badge');
  const ffzVipBadge = ffzChannelBadgeIndex.get('vip/vip_badge');

  rawTwitchBadges.split(',').forEach(rawBadge => {
    const [set, version] = rawBadge.split('/');

    if (!set || !version) {
      return;
    }

    if (set === 'moderator' && version === '1' && ffzModBadge?.url?.trim()) {
      addBadge(badges, ffzModBadge, 'FFZ Channel Badge');
      return;
    }

    if (set === 'vip' && version === '1' && ffzVipBadge?.url?.trim()) {
      addBadge(badges, ffzVipBadge, 'FFZ Channel Badge');
      return;
    }

    const channelBadge = findTwitchChannelBadge(
      twitchChannelBadges,
      set,
      version,
    );

    if (channelBadge?.url?.trim()) {
      addBadge(badges, channelBadge, 'Twitch Channel Badge');
      return;
    }

    const globalBadge = findTwitchGlobalBadge(twitchGlobalBadges, set, version);

    if (globalBadge?.url?.trim()) {
      addBadge(badges, globalBadge, 'Twitch Global Badge');
    }
  });

  return badges;
}

function getTagBadges(
  rawTwitchBadges: string,
  twitchChannelBadges: SanitisedBadgeSet[],
  twitchGlobalBadges: SanitisedBadgeSet[],
  ffzChannelBadges: SanitisedBadgeSet[],
): SanitisedBadgeSet[] {
  syncTagBadgeCollections(
    twitchChannelBadges,
    twitchGlobalBadges,
    ffzChannelBadges,
  );

  const current = tagBadgeCache.get(rawTwitchBadges);

  if (current) {
    return current;
  }

  const badges =
    previousTagBadgeCache.get(rawTwitchBadges) ??
    buildTagBadges(
      rawTwitchBadges,
      twitchChannelBadges,
      twitchGlobalBadges,
      ffzChannelBadges,
    );

  if (tagBadgeCache.size >= TAG_BADGE_CACHE_GENERATION_SIZE) {
    previousTagBadgeCache = tagBadgeCache;
    tagBadgeCache = new Map();
  }

  tagBadgeCache.set(rawTwitchBadges, badges);
  return badges;
}

const NO_USER_BADGES: SanitisedBadgeSet[] = [];

/**
 * Badges keyed to the sender rather than the badge tag, in the order they
 * join the result.
 */
function findUserBadges({
  userstate,
  ffzGlobalBadges,
  bttvBadges,
  chatterinoBadges,
  getEntitledBadge,
}: FindBadgesParams): SanitisedBadgeSet[] {
  let userBadges: SanitisedBadgeSet[] | undefined;

  const senderLogin = normaliseChatUsername(userstate.login);

  const globalFfzBadges = senderLogin
    ? getBadgeOwnerIndex(ffzGlobalBadges).get(senderLogin)
    : undefined;

  globalFfzBadges?.forEach(b => {
    userBadges ??= [];

    userBadges.push({
      title: b.title,
      id: b.id,
      set: b.id,
      type: 'FFZ Global Badge',
      url: b.url,
      color: b.color,
      owner_username: b.owner_username,
      provider: b.provider,
    });
  });

  const userId = userstate['user-id'];

  if (!userId) {
    return userBadges ?? NO_USER_BADGES;
  }

  const entitledBadge = getEntitledBadge(userId);

  if (entitledBadge) {
    userBadges ??= [];
    userBadges.push(entitledBadge);
  }

  const bttvBadge = getBadgeUserIdIndex(bttvBadges).get(userId);

  if (bttvBadge) {
    userBadges ??= [];
    userBadges.push(bttvBadge);
  }

  const chatterinoBadge = getBadgeUserIdIndex(chatterinoBadges).get(userId);

  if (chatterinoBadge) {
    userBadges ??= [];
    userBadges.push(chatterinoBadge);
  }

  return userBadges ?? NO_USER_BADGES;
}

/**
 * The result shares one array between every message with the same badge tag
 * and no per-user badge, so callers must not mutate it.
 */
export function findBadges(params: FindBadgesParams): SanitisedBadgeSet[] {
  const tagBadges = getTagBadges(
    getRawTwitchBadges(params.userstate),
    params.twitchChannelBadges,
    params.twitchGlobalBadges,
    params.ffzChannelBadges,
  );

  const userBadges = findUserBadges(params);

  if (userBadges.length === 0) {
    return tagBadges;
  }

  const badges = tagBadges.slice();

  userBadges.forEach(badge => {
    addBadgeIfMissing(badges, badge);
  });

  return badges;
}
