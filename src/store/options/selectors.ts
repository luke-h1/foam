/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '..';
import { meLoginSelector } from '../slices/chat/selectors';
import createOptionsCategories from './createOptionsCategories';

const getHighlightRegex = (highlightKeywords: string, meLogin?: string) => {
  const keywords: string[] = [];
  if (meLogin) keywords.push(meLogin);
  if (highlightKeywords) {
    for (const keyword of highlightKeywords.split(',')) {
      const normalizedKeyword = keyword.trim();
      if (normalizedKeyword) keywords.push(normalizedKeyword);
    }
  }
  if (keywords.length === 0) return;
  return new RegExp(`(${keywords.join('|')})`, 'i');
};

export default getHighlightRegex;

export const optionsSelector = (state: RootState) => state.chat.options;

export const showCardsSelector = createSelector(optionsSelector, options => ({
  twitch: options.twitch.cards,
  youtube: options.youtube.cards,
}));

export const timestampFormatSelector = (state: RootState) =>
  state.chat.options.ui.timestampFormat;

export const splitChatSelector = (state: RootState) =>
  state.chat.options.ui.splitChat;

const highlightKeywordsSelector = (state: RootState) =>
  state.chat.options.notifications.highlightKeywords;

export const highlightRegExpSelector = createSelector(
  highlightKeywordsSelector,
  meLoginSelector,
  getHighlightRegex,
);

export const optionsCategoriesSelector = createSelector(
  optionsSelector,
  createOptionsCategories,
);
