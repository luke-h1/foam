/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import {
  AllBadges,
  MessageBadge,
  MessageBadgeType,
} from '../services/types/badges/types';

export const badgesSelector = createSelector(
  (state: RootState) => state.chat.badges.twitch.data,
  (state: RootState) =>
    state.chat.channels.entities[state.chat.currentChannel!]?.badges.twitch
      .data,
  (state: RootState) => state.chat.badges.bttv.data,
  (state: RootState) => state.chat.badges.ffz.data,
  (state: RootState) => state.chat.badges.ffzAp.data,
  (state: RootState) => state.chat.badges.stv.data,
  (state: RootState) => state.chat.badges.chatterino.data,
  (
    twitchGlobal,
    twitchChannel,
    bttv,
    ffz,
    ffzAp,
    stv,
    chatterino,
  ): AllBadges => ({
    twitchGlobal,
    twitchChannel,
    bttv,
    ffz,
    ffzAp,
    stv,
    chatterino,
  }),
);
export const twitchGlobalBadgesSelector = (state: RootState) =>
  state.chat.badges.twitch.data;
export const twitchChannelBadgesSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel!]?.badges.twitch.data;
export const bttvBadgesSelector = (state: RootState) =>
  state.chat.badges.bttv.data;
export const ffzBadgesSelector = (state: RootState) =>
  state.chat.badges.ffz.data;
export const ffzApBadgesSelector = (state: RootState) =>
  state.chat.badges.ffzAp.data;
export const stvBadgesSelector = (state: RootState) =>
  state.chat.badges.stv.data;
export const chatterinoBadgesSelector = (state: RootState) =>
  state.chat.badges.chatterino.data;

const meGlobalBadgesSelector = (state: RootState) =>
  state.chat.me.globalUserState?.badges;

const meChannelBadgesSelector = (state: RootState) =>
  state.chat.channels.entities[state.chat.currentChannel!]?.userState?.badges;

export const meBadgesSelector = createSelector(
  meGlobalBadgesSelector,
  meChannelBadgesSelector,
  (global = {}, channel = {}) =>
    Object.entries({ ...channel, ...global }).map<MessageBadge>(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ([name, version]) => [MessageBadgeType.TWITCH, name, version],
    ),
);
