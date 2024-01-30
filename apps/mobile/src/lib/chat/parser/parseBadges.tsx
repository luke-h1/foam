import {
  ParseBadgesOptions,
  BadgeVersion,
  BadgeIds,
} from '@app/services/twitchBadgeService';
import { getBadges } from '../badges/badgesStore';

const defaultOptions: ParseBadgesOptions = {
  channelId: 'monstercat',
};

const toMinimalArray = (versions: BadgeVersion[]): string[][] => {
  return versions.map(version => [
    version.image_url_1x,
    version.image_url_2x,
    version.image_url_4x,
  ]);
};

const toHtml = (versions: BadgeVersion[], size: number) => {
  // map size 0 to 1 and 3 to 4
  // eslint-disable-next-line no-nested-ternary, no-param-reassign, @typescript-eslint/no-unused-vars
  size = size === 0 ? 1 : size === 3 ? 4 : size;

  return versions.map(
    version =>
      `<img src="${version.image_url_1x ?? version.image_url_2x ?? version.image_url_4x}" alt="${version.title}" />`,
  );
};

export const parseBadges = async (
  badges: BadgeIds,
  options: Partial<ParseBadgesOptions>,
) => {
  // eslint-disable-next-line no-underscore-dangle
  const _options: ParseBadgesOptions = { ...defaultOptions, ...options };

  const badgeVersions = await getBadges(_options.channelId);
  const userBadges: BadgeVersion[] = [];

  Object.keys(badges).forEach(code => {
    const versions = badgeVersions.get(code);
    const version = badges[code];
    const badge = versions?.[version];
    if (badge) {
      userBadges.push(badge);
    }
  });
  // eslint-disable-next-line consistent-return
  return {
    toBasicArray: () => userBadges,
    toMinimalArray: () => toMinimalArray(userBadges),
    toHtml: (size: number) => toHtml(userBadges, size),
  };
};
