import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { ChatUser } from '@app/store/chatStore/constants';
import { getUserBadge } from '@app/store/chatStore/cosmetics';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';

interface FindBadgesParams {
  userstate: UserStateTags;
  twitchChannelBadges: SanitisedBadgeSet[];
  twitchGlobalBadges: SanitisedBadgeSet[];
  ffzGlobalBadges: SanitisedBadgeSet[];
  ffzChannelBadges: SanitisedBadgeSet[];
  chatUsers: ChatUser[];
  chatterinoBadges: SanitisedBadgeSet[];
}

const addBadge = (
  badges: SanitisedBadgeSet[],
  badge: SanitisedBadgeSet,
  fallbackType: SanitisedBadgeSet['type'],
): void => {
  const existingBadge = badges.find(
    existing => existing.id === badge.id && existing.set === badge.set,
  );
  if (existingBadge) {
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
  });
};

const getRawTwitchBadges = (userstate: UserStateTags): string => {
  const sourceBadges = userstate['source-badges'];

  if (sourceBadges && sourceBadges.length > 0) {
    return sourceBadges;
  }

  return userstate['badges-raw'] || '';
};

const findTwitchChannelBadge = (
  twitchChannelBadges: SanitisedBadgeSet[],
  set: string,
  version: string,
): SanitisedBadgeSet | undefined =>
  twitchChannelBadges.find(b => b.set === set && b.id === version);

const findTwitchGlobalBadge = (
  twitchGlobalBadges: SanitisedBadgeSet[],
  set: string,
  version: string,
): SanitisedBadgeSet | undefined =>
  twitchGlobalBadges.find(b => b.set === set && b.id === `${set}_${version}`);

export function findBadges({
  userstate,
  twitchChannelBadges,
  twitchGlobalBadges,
  ffzGlobalBadges,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ffzChannelBadges: _ffzChannelBadges,
  chatUsers,
  chatterinoBadges,
}: FindBadgesParams): SanitisedBadgeSet[] {
  const badges: SanitisedBadgeSet[] = [];

  /**
   * Twitch badges
   */
  const rawTwitchBadges = getRawTwitchBadges(userstate);

  if (rawTwitchBadges.length > 0) {
    const rawBadges = rawTwitchBadges.split(',');

    // eslint-disable-next-line no-restricted-syntax
    for (const rawBadge of rawBadges) {
      const [set, version] = rawBadge.split('/');
      if (!set || !version) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const channelBadge = findTwitchChannelBadge(
        twitchChannelBadges,
        set,
        version,
      );

      if (channelBadge) {
        addBadge(badges, channelBadge, 'Twitch Channel Badge');
        // eslint-disable-next-line no-continue
        continue;
      }

      const globalBadge = findTwitchGlobalBadge(
        twitchGlobalBadges,
        set,
        version,
      );

      if (globalBadge) {
        addBadge(badges, globalBadge, 'Twitch Global Badge');
      }
    }
  }

  const globalFfzBadges = ffzGlobalBadges.filter(
    b => b.owner_username === userstate.username,
  );

  globalFfzBadges.forEach(b => {
    const existingBadge = badges.find(
      existing => existing.id === b.id && existing.set === b.id,
    );
    if (!existingBadge) {
      badges.push({
        title: b.title,
        id: b.id,
        set: b.id,
        type: 'FFZ Global Badge',
        url: b.url,
        color: b.color,
        owner_username: b.owner_username,
      });
    }
  });

  const stvUser = chatUsers.find(u => u.name === `@${userstate.username}`);

  if (stvUser && stvUser.cosmetics?.badge_id) {
    const stvBadge = stvUser.cosmetics.badges.find(
      b => b.id === stvUser.cosmetics?.badge_id,
    );

    if (stvBadge) {
      const existingBadge = badges.find(
        existing =>
          existing.id === stvBadge.id && existing.set === stvBadge.set,
      );
      if (!existingBadge) {
        badges.push(stvBadge);
      }
    }
  }

  if (userstate['user-id']) {
    const storeBadge = getUserBadge(userstate['user-id']);
    if (storeBadge) {
      const existingBadge = badges.find(
        existing =>
          existing.id === storeBadge.id && existing.set === storeBadge.set,
      );
      if (!existingBadge) {
        badges.push(storeBadge);
      }
    }
  }

  const chatterinoBadge = chatterinoBadges.find(
    b => b.id === userstate['user-id'],
  );

  if (chatterinoBadge) {
    const existingBadge = badges.find(
      existing =>
        existing.id === chatterinoBadge.id &&
        existing.set === chatterinoBadge.set,
    );
    if (!existingBadge) {
      badges.push(chatterinoBadge);
    }
  }

  return badges;
}
