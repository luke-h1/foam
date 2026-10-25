type ParsedBadges = {
  'badges-raw': string;
  badges: Record<string, string>;
};

/**
 * The IRC `badges` tag is a comma-separated string:
 * "moderator/1,subscriber/12,bits/1000".
 */
export function parseBadges(badgesString?: string): ParsedBadges {
  const badges: Record<string, string> = {};
  const badgesRaw = badgesString || '';

  for (const badge of badgesRaw.split(',')) {
    const [badgeName, version] = badge.split('/');
    if (badgeName && version) {
      badges[badgeName] = version;
    }
  }

  return {
    'badges-raw': badgesRaw,
    badges,
  };
}
