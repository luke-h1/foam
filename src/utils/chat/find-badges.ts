import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { normalizeSevenTvBadge } from '@app/utils/seven-tv/cosmetics/normalize-seven-tv-badge';

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
   * invalidate - why a result-level findBadges cache was rejected (PERF_REPORT.md).
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
 * Index each array once per array identity so every per-message lookup is a
 * single Map hit instead of a scan over thousands of entries.
 */
/**
 * Builds an index once per badge array and keeps it on a WeakMap keyed by that
 * array, so a re-render handed the same array skips the rebuild.
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

/**
 * Keyed by owner username, holding every badge that owner has.
 */
const getBadgeOwnerIndex = memoisedBadgeIndex(badges => {
  const map = new Map<string, SanitisedBadgeSet[]>();

  for (const badge of badges) {
    const owner = badge.owner_username;

    if (!owner) {
      // eslint-disable-next-line no-continue
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

export function findBadges({
  userstate,
  twitchChannelBadges,
  twitchGlobalBadges,
  ffzChannelBadges,
  ffzGlobalBadges,
  bttvBadges,
  chatterinoBadges,
  getEntitledBadge,
}: FindBadgesParams): SanitisedBadgeSet[] {
  const badges: SanitisedBadgeSet[] = [];

  // Custom FFZ channel art overrides the default Twitch mod/VIP badge.
  const ffzChannelBadgeIndex = getBadgeSetIndex(ffzChannelBadges);

  const ffzModBadge = ffzChannelBadgeIndex.get('mod/mod_badge');
  const ffzVipBadge = ffzChannelBadgeIndex.get('vip/vip_badge');

  const rawTwitchBadges = getRawTwitchBadges(userstate);

  rawTwitchBadges.split(',').forEach(rawBadge => {
    const [set, version] = rawBadge.split('/');

    if (!set || !version) {
      return;
    }

    if (set === 'moderator' && version === '1' && ffzModBadge?.url?.trim()) {
      addBadge(badges, ffzModBadge, 'FFZ channel badge');
      return;
    }

    if (set === 'vip' && version === '1' && ffzVipBadge?.url?.trim()) {
      addBadge(badges, ffzVipBadge, 'FFZ channel badge');
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

  const globalFfzBadges = userstate.username
    ? (getBadgeOwnerIndex(ffzGlobalBadges).get(userstate.username) ?? [])
    : [];

  globalFfzBadges.forEach(b => {
    addBadgeIfMissing(badges, {
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

  const entitledBadge = userstate['user-id']
    ? getEntitledBadge(userstate['user-id'])
    : undefined;

  if (entitledBadge) {
    addBadgeIfMissing(badges, entitledBadge);
  }

  const bttvBadge = userstate['user-id']
    ? getBadgeUserIdIndex(bttvBadges).get(userstate['user-id'])
    : undefined;

  if (bttvBadge) {
    addBadgeIfMissing(badges, bttvBadge);
  }

  const chatterinoBadge = userstate['user-id']
    ? getBadgeUserIdIndex(chatterinoBadges).get(userstate['user-id'])
    : undefined;

  if (chatterinoBadge) {
    addBadgeIfMissing(badges, chatterinoBadge);
  }

  return badges;
}
