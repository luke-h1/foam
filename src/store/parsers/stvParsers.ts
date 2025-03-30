/* eslint-disable no-restricted-syntax */

import {
  StvEmote,
  StvCosmeticsResponse,
  StvCosmetics,
  StvGlobalEmotesResponse,
  StvChannelEmotesResponse,
} from '../services/types/stv';
import { Emote } from '../services/types/util';

export const parseStvGlobalEmotes = (
  data: StvGlobalEmotesResponse,
): Emote<StvEmote> => {
  const result: Emote<StvEmote> = { entries: {}, names: {} };

  for (const emote of data.emotes) {
    result.entries[emote.id] = emote;
    result.names[emote.name] = emote.id;
  }
  return result;
};

export const parseStvChannelEmotes = (
  data: StvChannelEmotesResponse,
): Emote<StvEmote> => {
  const result: Emote<StvEmote> = { entries: {}, names: {} };

  for (const emote of data.emote_set.emotes) {
    result.entries[emote.id] = emote;
    result.names[emote.name] = emote.id;
  }

  return result;
};

export const parseStvCosmetics = (data: StvCosmeticsResponse): StvCosmetics => {
  const badges: StvCosmetics['badges'] = { entries: {}, users: {} };

  for (const { users, ...badge } of data.badges) {
    badges.entries[badge.id] = badge;

    for (const userId of users) {
      if (!badges.users[userId]) {
        badges.users[userId] = [];
      }
      badges.users[userId].push(badge.id);
    }
  }
  return {
    badges,
  };
};
