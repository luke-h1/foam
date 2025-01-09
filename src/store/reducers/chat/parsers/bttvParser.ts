import {
  BttvGlobalEmotesResponse,
  BttvCommonEmote,
  BttvChannelEmotesResponse,
  BttvDetailedEmote,
  BttvBadge,
} from '@app/services/bttvService';
import { Badge, Emote } from '@app/services/types/util';

export const parseBttvGlobalEmotes = (
  data: BttvGlobalEmotesResponse,
): Emote<BttvCommonEmote> => {
  const result: Emote<BttvCommonEmote> = { entries: {}, names: {} };

  // eslint-disable-next-line no-restricted-syntax
  for (const emote of data) {
    result.entries[emote.id] = emote;
    result.names[emote.code] = emote.id;
  }

  return result;
};

export const parseBttvChannelEmotes = (
  data: BttvChannelEmotesResponse,
): Emote<BttvDetailedEmote> => {
  const result: Emote<BttvDetailedEmote> = { entries: {}, names: {} };

  // eslint-disable-next-line no-restricted-syntax
  for (const emote of data.channelEmotes) {
    result.entries[emote.id] = emote;
    result.names[emote.code] = emote.id;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const emote of data.sharedEmotes) {
    result.entries[emote.id] = emote;
    result.names[emote.code] = emote.id;
  }

  return result;
};

export const parseBttvGlobalBadges = (data: BttvBadge[]): Badge<BttvBadge> => {
  const result: Badge<BttvBadge> = { entries: {}, users: {} };

  // eslint-disable-next-line no-restricted-syntax
  for (const badge of data) {
    result.entries[badge.id] = badge;
    result.users[badge.providerId] = [badge.id];
  }

  return result;
};
