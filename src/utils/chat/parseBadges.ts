/**
 * The IRC `badges` tag is a comma-separated string:
 * "moderator/1,subscriber/12,bits/1000".
 */
export function parseBadges(badgesString?: string): {
  'badges-raw': string;
  badges: Record<string, string>;
} {
  const badges: Record<string, string> = {};
  const badgesRaw = badgesString || '';

  if (badgesRaw) {
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
