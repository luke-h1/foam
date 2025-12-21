import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { ChatUser } from '@app/store/chatStore';
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
  // // Write userstate to file
  // const userstateLogPath = path.join(process.cwd(), 'userstate-log.json');
  // const existingData: ChatUserstate[] = fs.existsSync(userstateLogPath)
  //   ? (JSON.parse(
  //       fs.readFileSync(userstateLogPath, 'utf-8'),
  //     ) as ChatUserstate[])
  //   : [];

  // existingData.push(userstate);
  // fs.writeFileSync(userstateLogPath, JSON.stringify(existingData, null, 2));

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

      /**
       * Chatterino badges
       */

      /**
       * FFZ global badges
       */
      const globalFfzBadges = ffzGlobalBadges.filter(
        b => b.owner_username === userstate.username,
      );

      globalFfzBadges.forEach(b => {
        // Check if badge already exists to prevent duplicates
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

      /**
       * FFZ channel badges
       */

      /**
       * 7TV badges
       */
      const stvUser = chatUsers.find(u => u.name === `@${userstate.username}`);

      if (stvUser && stvUser.cosmetics?.badge_id) {
        const stvBadge = stvUser.cosmetics.badges.find(
          b => b.id === stvUser.cosmetics?.badge_id,
        );

        if (stvBadge) {
          // Check if badge already exists to prevent duplicates
          const existingBadge = badges.find(
            existing =>
              existing.id === stvBadge.id && existing.set === stvBadge.set,
          );
          if (!existingBadge) {
            badges.push(stvBadge);
          }
        }
      }

      /**
       * Chatterino badges
       */
      const chatterinoBadge = chatterinoBadges.find(
        b => b.id === userstate['user-id'],
      );

      if (chatterinoBadge) {
        // Check if badge already exists to prevent duplicates
        const existingBadge = badges.find(
          existing =>
            existing.id === chatterinoBadge.id &&
            existing.set === chatterinoBadge.set,
        );
        if (!existingBadge) {
          badges.push(chatterinoBadge);
        }
      }
    }
  }

  return badges;
}
