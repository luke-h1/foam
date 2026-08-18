import { twitchSanitisedChannelBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedChannelBadges.fixture';
import { twitchSanitisedGlobalBadges } from '@app/services/__fixtures__/badges/twitch/twitchSanitisedGlobalBadges.fixture';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

export function createChatterinoBadge(index: number): SanitisedBadgeSet {
  return {
    // Indexed by badge.id === chatter user-id for BTTV/Chatterino lookups.
    id: `chatterino-user-${index}`,
    url: `https://cdn.example.com/chatterino/${index}.png`,
    type: 'Chatterino Badge',
    provider: 'chatterino',
    title: `Chatterino ${index}`,
    set: 'chatterino',
    owner_username: `chatter${index}`,
  };
}

/**
 * Chatterino's flattened list is thousands of entries; almost none match a
 * given chatter. Large enough to punish a per-message linear scan.
 */
export const denseChatterinoBadges = Array.from({ length: 2500 }, (_, index) =>
  createChatterinoBadge(index),
);

const noBadges: SanitisedBadgeSet[] = [];

export const denseBadgeSources = {
  twitchGlobalBadges: twitchSanitisedGlobalBadges,
  twitchChannelBadges: twitchSanitisedChannelBadges,
  ffzChannelBadges: noBadges,
  ffzGlobalBadges: noBadges,
  bttvBadges: noBadges,
  chatterinoBadges: denseChatterinoBadges,
  getEntitledBadge: () => null,
};

export const badgeLookupUserstates = Array.from({ length: 120 }, (_, index) => {
  const global =
    twitchSanitisedGlobalBadges[index % twitchSanitisedGlobalBadges.length];
  const channel =
    twitchSanitisedChannelBadges[index % twitchSanitisedChannelBadges.length];
  const chatterino = denseChatterinoBadges[index * 17];
  const rawParts = [global, channel].flatMap(badge =>
    badge ? [`${badge.set}/${badge.id.split('_').pop()}`] : [],
  );

  return createUserStateTags({
    'badges-raw': rawParts.join(','),
    badges: Object.fromEntries(
      rawParts.map(part => {
        const [set, version] = part.split('/');
        return [set, version];
      }),
    ),
    'user-id': chatterino?.id ?? `user-${index}`,
    username: chatterino?.owner_username ?? `user${index}`,
    login: chatterino?.owner_username ?? `user${index}`,
  });
});
