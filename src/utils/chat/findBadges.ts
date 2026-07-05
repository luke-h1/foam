import { normalizeSevenTvBadge } from '@app/components/Chat/util/normalizeSevenTvCosmetics';
import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import type { ChatUser } from '@app/store/chat/types/constants';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

interface FindBadgesParams {
  userstate: UserStateTags;
  twitchChannelBadges: SanitisedBadgeSet[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  chatUsers: ChatUser[];
  chatterinoBadges: SanitisedBadgeSet[];
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
  if (hasBadge(badges, badge)) {
    return;
  }

  badges.push({
    title: badge.title,
    url: badge.url,
    type: badge.type || fallbackType,
    set: badge.set || '',
    id: badge.id,
    color: badge.color,
    owner_username: badge.owner_username,
    ...(badge.provider ? { provider: badge.provider } : {}),
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
 * findBadges runs once per message (and again per visible message during 7TV
 * hydration reprocessing), so linear scans over the badge arrays add up fast —
 * the flattened Chatterino list alone holds thousands of entries, almost none
 * of which match a given chatter. Index each array once per array identity
 * (the arrays are stable until the channel's badge data is refetched) so every
 * per-message lookup is a single Map hit.
 */
const badgeSetIndexCache = new WeakMap<
  SanitisedBadgeSet[],
  ReadonlyMap<string, SanitisedBadgeSet>
>();

const getBadgeSetIndex = (
  badges: SanitisedBadgeSet[],
): ReadonlyMap<string, SanitisedBadgeSet> => {
  let index = badgeSetIndexCache.get(badges);
  if (!index) {
    const map = new Map<string, SanitisedBadgeSet>();
    badges.forEach(badge => {
      const key = `${badge.set}/${badge.id}`;
      if (!map.has(key)) {
        map.set(key, badge);
      }
    });
    badgeSetIndexCache.set(badges, map);
    index = map;
  }
  return index;
};

const badgeUserIdIndexCache = new WeakMap<
  SanitisedBadgeSet[],
  ReadonlyMap<string, SanitisedBadgeSet>
>();

const getBadgeUserIdIndex = (
  badges: SanitisedBadgeSet[],
): ReadonlyMap<string, SanitisedBadgeSet> => {
  let index = badgeUserIdIndexCache.get(badges);
  if (!index) {
    const map = new Map<string, SanitisedBadgeSet>();
    badges.forEach(badge => {
      if (!map.has(badge.id)) {
        map.set(badge.id, badge);
      }
    });
    badgeUserIdIndexCache.set(badges, map);
    index = map;
  }
  return index;
};

const badgeOwnerIndexCache = new WeakMap<
  SanitisedBadgeSet[],
  ReadonlyMap<string, SanitisedBadgeSet[]>
>();

const getBadgeOwnerIndex = (
  badges: SanitisedBadgeSet[],
): ReadonlyMap<string, SanitisedBadgeSet[]> => {
  let index = badgeOwnerIndexCache.get(badges);
  if (!index) {
    const map = new Map<string, SanitisedBadgeSet[]>();
    badges.forEach(badge => {
      if (!badge.owner_username) {
        return;
      }
      const existing = map.get(badge.owner_username);
      if (existing) {
        existing.push(badge);
      } else {
        map.set(badge.owner_username, [badge]);
      }
    });
    badgeOwnerIndexCache.set(badges, map);
    index = map;
  }
  return index;
};

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
  ffzGlobalBadges,
  chatUsers,
  chatterinoBadges,
}: FindBadgesParams): SanitisedBadgeSet[] {
  const badges: SanitisedBadgeSet[] = [];

  const rawTwitchBadges = getRawTwitchBadges(userstate);

  if (rawTwitchBadges.length > 0) {
    rawTwitchBadges.split(',').forEach(rawBadge => {
      const [set, version] = rawBadge.split('/');
      if (!set || !version) {
        return;
      }

      const channelBadge = findTwitchChannelBadge(
        twitchChannelBadges,
        set,
        version,
      );

      if (channelBadge) {
        addBadge(badges, channelBadge, 'Twitch Channel Badge');
        return;
      }

      const globalBadge = findTwitchGlobalBadge(
        twitchGlobalBadges,
        set,
        version,
      );

      if (globalBadge) {
        addBadge(badges, globalBadge, 'Twitch Global Badge');
      }
    });
  }

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
    });
  });

  const stvUser = chatUsers.find(u => u.name === `@${userstate.username}`);

  if (stvUser && stvUser.cosmetics?.badge_id) {
    const stvBadge = stvUser.cosmetics.badges.find(
      b => b.id === stvUser.cosmetics?.badge_id,
    );

    if (stvBadge) {
      addBadgeIfMissing(badges, stvBadge);
    }
  }

  if (userstate['user-id']) {
    const storeBadge = getUserBadge(userstate['user-id']);
    if (storeBadge) {
      addBadgeIfMissing(badges, storeBadge);
    }
  }

  const chatterinoBadge = userstate['user-id']
    ? getBadgeUserIdIndex(chatterinoBadges).get(userstate['user-id'])
    : undefined;

  if (chatterinoBadge) {
    addBadgeIfMissing(badges, chatterinoBadge);
  }

  return badges;
}
