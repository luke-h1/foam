/**
 * Parse badges from Twitch IRC tags
 * Badges come as a comma-separated string: "moderator/1,subscriber/12,bits/1000"
 * Returns both the raw string and a parsed object
 * @example
 * parseBadges('moderator/1,subscriber/12,bits/1000')
 * // Returns:
 * // {
 * //   'badges-raw': 'moderator/1,subscriber/12,bits/1000',
 * //   badges: { moderator: '1', subscriber: '12', bits: '1000' },
 * // }
 */
export function parseBadges(badgesString?: string): {
  'badges-raw': string;
  badges: Record<string, string>;
} {
  const badges: Record<string, string> = {};
  const badgesRaw = badgesString || '';

  if (badgesRaw) {
    // Split by comma and parse each badge
    const badgeList = badgesRaw.split(',');
    badgeList.forEach(badge => {
      if (badge) {
        const [badgeName, version] = badge.split('/');
        if (badgeName && version) {
          badges[badgeName] = version;
        }
      }
    });
  }

  return {
    'badges-raw': badgesRaw,
    badges,
  };
}
