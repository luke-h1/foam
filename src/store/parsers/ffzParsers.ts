/* eslint-disable no-shadow */
/* eslint-disable no-bitwise */
/* eslint-disable no-restricted-syntax */
import {
  FfzApBadge,
  FfzBadge,
  FfzGlobalBadgesResponse,
} from '../services/types/ffz/badge';
import {
  FfzChannelEmotesResponse,
  FfzEmojiResponse,
  FfzEmote,
  FfzGlobalEmotesResponse,
} from '../services/types/ffz/emote';
import { Badge, Emote } from '../services/types/util';
import { Emoji } from '../slices/emotes/types';

export const parseFfzGlobalEmotes = ({
  default_sets: defaultSets,
  sets,
}: FfzGlobalEmotesResponse): Emote<FfzEmote> => {
  const result: Emote<FfzEmote> = { entries: {}, names: {} };

  for (const setId of defaultSets) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for (const emote of sets[setId].emoticons) {
      result.entries[emote.id] = emote;
      result.names[emote.name] = emote.id.toString();
    }
  }
  return result;
};

export const parseFfzChannelEmotes = ({
  room,
  sets,
}: FfzChannelEmotesResponse): Emote<FfzEmote> => {
  const result: Emote<FfzEmote> = { entries: {}, names: {} };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const emote of sets[room.set].emoticons) {
    result.entries[emote.id] = emote;
    result.names[emote.name] = emote.id.toString();
  }

  return result;
};

const codePointsToString = (codePoints: string): string => {
  return String.fromCodePoint(
    ...codePoints.split('-').map(s => parseInt(s, 16)),
  );
};

// https://github.com/FrankerFaceZ/FrankerFaceZ/blob/master/src/modules/chat/emoji.js#L305
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
      for (const n of name) result.names[`:${n}:`] = codePoints;
      // for (const n of name) names.push(n);
    } else {
      result.names[`:${name}:`] = codePoints;
      // names.push(name);
    }
  };

  // @ts-expect-error - symbol iterator
  for (const [category, sort, name, , codePoints, , has, variants] of emojis) {
    // eslint-disable-next-line no-continue
    if (!hasInTwitter(has)) continue;

    const char = codePointsToString(codePoints);

    addToNames(char, name, codePoints);

    result.entries[codePoints] = {
      category,
      sort,
      char,
      name,
      codePoints,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      variants: variants ? variants.map(([codePoints]) => codePoints) : [],
    };

    if (Array.isArray(variants)) {
      for (const [codePoints, , , , , name] of variants) {
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
      }
    }
  }

  return result;
};

export const parseFfzGlobalBadges = ({
  badges,
  users,
}: FfzGlobalBadgesResponse): Badge<FfzBadge> => {
  const result: Badge<FfzBadge> = { entries: {}, users: {} };

  for (const badge of badges) {
    result.entries[badge.id] = badge;
  }

  for (const [badgeId, userIds] of Object.entries(users)) {
    for (const userId of userIds) {
      if (!result.users[userId]) {
        result.users[userId] = [];
      }
      result.users[userId].push(badgeId);
    }
  }
  return result;
};

// https://api.ffzap.com/v1/user/badge/default/3
// https://api.ffzap.com/v1/user/badge/${user.id}/3
// https://github.com/FrankerFaceZ/Add-Ons/blob/master/src/ffzap-core/index.js
export const parseFfzApGlobalBadges = (
  data: FfzApBadge[],
): Badge<FfzApBadge> => {
  const result: Badge<FfzApBadge> = { entries: {}, users: {} };

  for (const badge of data) {
    result.entries[badge.id] = badge;
    result.users[badge.id] = [badge.id.toString()];
  }

  return result;
};
