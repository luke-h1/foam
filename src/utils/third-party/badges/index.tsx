import { Image } from 'expo-image';
import { View } from 'react-native';
import { CommonUserstate } from 'tmi.js';
import { BadgesParser, ParserOptions, ParsedBadges } from '../types';
import { loadOptions } from '../util/load-options';
import { twitchBadgesParser } from './twitch-badges';

const badgeParsers: BadgesParser[] = [
  twitchBadgesParser,
  // ffzBadgesParser,
  // bttvBadgesParser,
];

export const parseBadges = async (
  badges: CommonUserstate['badges'],
  username: string | null = null,
  _options: Partial<ParserOptions> | null = null,
) => {
  const options = loadOptions(_options);
  const parsedBadges = replaceBadges(
    (
      await Promise.all(
        badgeParsers.map(async parser => {
          return parser.parse(badges || {}, username, options.channelId);
        }),
      )
    ).flat(),
  );

  return {
    toArray: () => parsedBadges,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toHTML: (scale = 1, _inlineStyles = true) =>
      parsedBadges.map(badge => {
        console.log('badge', badge);
        const height = [18, 20, 22][scale];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const offset = [4, 5, 6][scale] * -1;

        console.log('badge img', badge.images[0]);

        // eslint-disable-next-line no-console
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
              alignItems: 'center',
            }}
          >
            <Image
              source={badge.images[0] || badge.images?.[scale]}
              key={badge.title}
              alt={badge.title}
              style={{
                height: 30,
                width: 30,
                marginBottom: offset,
                borderRadius: 2,
                backgroundColor: badge.color,
              }}
            />
          </View>
        );
      }),
  };
};

export const reloadBadges = async (
  _options: Partial<ParserOptions> | null = null,
) => {
  const options = loadOptions(_options);
  await Promise.all(
    badgeParsers.map(async parser => {
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
