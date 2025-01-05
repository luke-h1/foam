import { RootState } from '@app/store';
import { badgesSelector } from '@app/store/selectors/badges';
import parseBadgesTag from './parseBadgesTag';
import createMessageBadges from './createMessageBadges';
import { emotesSelector } from '@app/store/selectors/emote';
import createMessageParts from './createMessageParts';

function parsePrivMsgBody(content: string): [body: string, isAction: boolean] {
  if (!content) {
    // eslint-disable-next-line no-console
    console.warn('No content');
  }

  return content.startsWith('\u0001ACTION ')
    ? [content.slice(8, -1), true]
    : [content, false];
}

// badges
export function createBadges(state: RootState) {
  const allBadges = badgesSelector(state);

  // eslint-disable-next-line func-names
  return function (
    userId: string,
    // eslint-disable-next-line default-param-last
    badgesTag = '',
    badges?: Record<string, string>,
  ) {
    const userBadges = badges || parseBadgesTag(badgesTag);
    return createMessageBadges(allBadges, userBadges, userId);
  };
}

// parts
export function createParts(state: RootState) {
  const allEmotes = emotesSelector(state);

  // eslint-disable-next-line func-names
  return function (body: string, emotesTag = '', isSelf = false) {
    return createMessageParts(body, allEmotes, emotesTag, isSelf);
  };
}
