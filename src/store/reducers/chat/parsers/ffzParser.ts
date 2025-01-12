import {
  FfzGlobalEmotesResponse,
  FfzEmote,
  FfzChannelEmotesResponse,
  FfzEmojiResponse,
  FfzGlobalBadgesResponse,
  FfzBadge,
  FfzApBadge,
} from '@app/services/ffzService';
import { Badge, Emote } from '@app/services/types/util';
import { Emoji } from '../types/emote';

export const parseFfzGlobalEmotes = ({
  default_sets: defaultSets,
  sets,
}: FfzGlobalEmotesResponse): Emote<FfzEmote> => {
  const result: Emote<FfzEmote> = { entries: {}, names: {} };

  defaultSets.forEach(setId => {
    sets[setId].emoticons.forEach(emote => {
      result.entries[emote.id] = emote;
      result.names[emote.name] = emote.id.toString();
    });
  });
  return result;
};

export const parseFfzChannelEmotes = ({
  room,
  sets,
}: FfzChannelEmotesResponse): Emote<FfzEmote> => {
  const result: Emote<FfzEmote> = { entries: {}, names: {} };

  sets[room.set].emoticons.forEach(emoji => {
    result.entries[emoji.id] = emoji;
    result.names[emoji.name] = emoji.id.toString();
  });

  return result;
};

const codePointsToString = (codePoints: string): string => {
  return String.fromCodePoint(
    ...codePoints.split('-').map(s => parseInt(s, 16)),
  );
};

// eslint-disable-next-line no-bitwise
const hasInTwitter = (has: number) => 0b0010 & has;

export const parseFfzEmoji = ({
  e: emojis,
}: FfzEmojiResponse): Emote<Emoji> => {
  const result: Emote<Emoji> = { entries: {}, names: {} };
  // const names: string[] = [];

  const addToNames = (
    char: string,
    name: string | string[],
    codePoints: string,
  ) => {
    result.names[char] = codePoints;

    if (Array.isArray(name)) {
      name.forEach(n => {
        result.names[`:${n}:`] = codePoints;
      });
    } else {
      result.names[`:${name}:`] = codePoints;
      // names.push(name);
    }
  };

  emojis.forEach(emoji => {
    const { category, sort, name, codePoints, has, variants } = emoji;

    if (!hasInTwitter(has)) return;

    const char = codePointsToString(codePoints);

    addToNames(char, name, codePoints);

    result.entries[codePoints] = {
      category,
      sort,
      char,
      name,
      codePoints,
      variants: variants ? variants.map(variant => variant.codePoints) : [],
    };

    if (Array.isArray(variants)) {
      variants.forEach(variant => {
        // eslint-disable-next-line no-shadow
        const { codePoints, name } = variant;
        // eslint-disable-next-line no-shadow
        const char = codePointsToString(codePoints);

        addToNames(char, name, codePoints);

        result.entries[codePoints] = {
          category: -1,
          sort: -1,
          char,
          name,
          codePoints,
          variants: [],
        };
      });
    }
  });
  return result;
};

export const parseFfzGlobalBadges = ({
  badges,
  users,
}: FfzGlobalBadgesResponse): Badge<FfzBadge> => {
  const result: Badge<FfzBadge> = { entries: {}, users: {} };

  badges.forEach(badge => {
    result.entries[badge.id] = badge;
  });

  Object.entries(users).forEach(([badgeId, userIds]) => {
    userIds.forEach(userId => {
      if (!result.users[userId]) {
        result.users[userId] = [];
      }
      result.users[userId].push(badgeId);
    });
  });
  return result;
};

// https://api.ffzap.com/v1/user/badge/default/3
// https://api.ffzap.com/v1/user/badge/${user.id}/3
// https://github.com/FrankerFaceZ/Add-Ons/blob/master/src/ffzap-core/index.js
export const parseFfzApGlobalBadges = (
  data: FfzApBadge[],
): Badge<FfzApBadge> => {
  const result: Badge<FfzApBadge> = { entries: {}, users: {} };

  data.forEach(badge => {
    result.entries[badge.id] = badge;
    result.users[badge.id] = [badge.id.toString()];
  });

  return result;
};
