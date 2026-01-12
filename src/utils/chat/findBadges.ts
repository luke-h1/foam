import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { ChatUser, getUserBadge } from '@app/store/chatStore';
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
  if (userstate['badges-raw'] && userstate['badges-raw'].length > 0) {
    const rawBadges = userstate['badges-raw'].split(',');

    // eslint-disable-next-line no-restricted-syntax
    for (const badge of rawBadges) {
      /**
       * Subscriber / channel badges
       */
      if (badge.split('/')[0] === 'subscriber') {
        if (userstate.badges) {
          if (userstate.badges.subscriber) {
            // eslint-disable-next-line no-shadow
            const badge = twitchChannelBadges.find(
              b => b.id === userstate.badges?.subscriber,
            );

            if (badge) {
              // Check if badge already exists to prevent duplicates
              const existingBadge = badges.find(
                existing =>
                  existing.id === badge.id && existing.set === badge.set,
              );
              if (!existingBadge) {
                badges.push({
                  title: badge.title,
                  url: badge.url,
                  type: badge.type || 'Twitch Subscriber Badge',
                  set: badge?.set || '',
                  id: badge.id,
                  color: badge.color,
                  owner_username: badge.owner_username,
                });
              }
              // eslint-disable-next-line no-continue
              continue;
            }
          }
        }
      }

      /**
       * Bit badges
       */
      if (badge.split('/')[0] === 'bits') {
        if (userstate.badges?.bits) {
          // eslint-disable-next-line no-shadow
          const badge = twitchChannelBadges.find(
            b => b.id === userstate.badges?.bits,
          );

          if (badge) {
            // Check if badge already exists to prevent duplicates
            const existingBadge = badges.find(
              existing =>
                existing.id === badge.id && existing.set === badge.set,
            );
            if (!existingBadge) {
              badges.push({
                title: badge.title,
                url: badge.url,
                type: badge.type || 'Twitch Badge',
                set: badge?.set || '',
                id: badge.id,
                color: badge.color,
                owner_username: badge.owner_username,
              });
            }
          }
        }
      }

      /**
       * Global badges
       */
      const globalBadge = twitchGlobalBadges.find(
        b => b.id === `${badge.split('/')[0]}_${badge.split('/')[1]}`,
      );

      if (globalBadge) {
        // Check if badge already exists to prevent duplicates
        const existingBadge = badges.find(
          existing =>
            existing.id === globalBadge.id && existing.set === globalBadge.set,
        );
        if (!existingBadge) {
          badges.push({
            title: globalBadge.title,
            url: globalBadge.url,
            type: globalBadge.type || 'Twitch Global Badge',
            id: globalBadge.id,
            set: globalBadge.set ?? '',
            color: globalBadge.color,
            owner_username: globalBadge.owner_username,
          });
        }
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
