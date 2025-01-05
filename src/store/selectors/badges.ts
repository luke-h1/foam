import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { AllBadges } from '../reducers/chat/util/messages/types/badges';

export const badgesSelector = createSelector(
  (state: RootState) => state.chat.badges.twitch.data,
  (state: RootState) =>
    state.chat.channels.entities[state.chat.currentChannel as string]?.badges
      .twitch.data,
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
