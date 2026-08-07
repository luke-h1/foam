import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

/**
 * A screenful of chat: rows carrying a mix of Twitch badges (which short
 * circuit) and 7TV badges on both the already-canonical and the rewrite path.
 */
export const badgeRows: SanitisedBadgeSet[][] = Array.from(
  { length: 40 },
  (_unused, row) => [
    {
      id: 'moderator',
      set: 'moderator',
      type: 'Twitch Badge',
      title: 'Moderator',
      url: 'https://static-cdn.jtvnw.net/badges/v1/moderator/3',
    },
    {
      id: `stv-canonical-${row % 7}`,
      set: `stv-canonical-${row % 7}`,
      type: '7TV Badge',
      title: 'Subscriber',
      url: `https://cdn.7tv.app/badge/stv-canonical-${row % 7}/4x.webp`,
      provider: '7tv',
    },
    {
      id: `stv-legacy-${row % 5}`,
      set: `stv-legacy-${row % 5}`,
      type: '7TV Badge',
      title: 'Legacy',
      url: `//cdn.7tv.app/stv-legacy-${row % 5}/4x`,
      provider: '7tv',
    },
  ],
);
