import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';

export const optionsSelector = (state: RootState) => state.chat.options;

export const showCardsSelector = createSelector(optionsSelector, options => ({
  twitch: options.twitch.cards,
  youtube: options.youtube.cards,
}));
