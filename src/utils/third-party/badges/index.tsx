import Image from '@app/components/Image';
import { View } from 'react-native';
import { Badges } from 'tmi.js';
import { BadgesParser, ParserOptions, ParsedBadges } from '../types';
import { loadOptions } from '../util/load-options';
import { twitchBadgesParser } from './twitch-badges';

const badgeParsers: BadgesParser[] = [twitchBadgesParser];

export const parseBadges = async (
  badges: Badges | undefined,
  username: string | null = null,
  _options: Partial<ParserOptions> | null = null,
) => {
  const options = loadOptions(_options);
  const parsedBadges = replaceBadges(
    (
      await Promise.all(
        badgeParsers.map(async parser => {
          if (!options.providers?.[parser.provider]) {
            // eslint-disable-next-line no-console
            console.warn('No valid provider found for badges');
            return [];
          }

          if (!badges) {
            // eslint-disable-next-line no-console
            console.warn('No badges found');
            return [];
          }

          const parsed = await parser.parse(
            badges,
            username,
            options.channelId,
          );
          return parsed;
        }),
      )
    ).flat(),
  );
  return {
    toArray: () => parsedBadges,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toHTML: (scale = 1, _inlineStyles = true) =>
      parsedBadges
        .map(badge => {
          const height = [18, 20, 22][scale];
          const offset = [4, 5, 6][scale] * -1;

          // eslint-disable-next-line no-console
          console.log('badge is ->', badge);

          return (
            <View
              key={badge.title}
              style={{
                height,
                marginBottom: offset,
                borderRadius: 2,
                marginRight: offset,
                marginLeft: offset,
                backgroundColor: badge.color,
              }}
            >
              <Image
                source={badge.images[0] || badge.images?.[scale]}
                key={badge.title}
                alt={badge.title}
                style={{
                  height,
                  width: 20,
                  marginBottom: offset,
                  borderRadius: 2,
                  backgroundColor: badge.color,
                }}
              />
            </View>
          );
        })
        .join(' '),
  };
};

export const reloadBadges = async (
  _options: Partial<ParserOptions> | null = null,
) => {
  const options = loadOptions(_options);
  await Promise.all(
    badgeParsers.map(async parser => {
      if (!options.providers?.[parser.provider]) {
        return;
      }
      // eslint-disable-next-line consistent-return
      return parser.load(options.channelId, true);
    }),
  );
};

const replaceBadges = (parsedBadges: ParsedBadges): ParsedBadges =>
  parsedBadges.reduce((badges: ParsedBadges, badge, idx) => {
    if (badge.replaces) {
      const replaceIdx = badges.findIndex(x => x.id === badge.replaces);
      if (replaceIdx >= 0) {
        // eslint-disable-next-line no-param-reassign
        badges[replaceIdx] = badge;
        return badges.filter((_x, i) => i !== idx);
      }
    }
    return badges;
  }, parsedBadges);
