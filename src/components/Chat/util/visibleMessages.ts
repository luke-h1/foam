import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

interface VisibleMessageShape {
  message: ParsedPart[];
  message_id: string;
  sender: string;
  userstate: UserStateTags;
}

export interface VisibleMessagesOptions {
  currentUserId?: string;
  currentUsername?: string;
  hiddenPhrases?: string[];
  hiddenUsers?: string[];
  pauseAnchorMessageId?: string | null;
  searchQuery?: string;
  showOnlyMentions?: boolean;
}

function normalise(value: string | undefined | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function getMessageText(message: VisibleMessageShape): string {
  return replaceEmotesWithText(message.message);
}

function messageMentionsUsername(
  message: VisibleMessageShape,
  username: string | undefined,
): boolean {
  const target = normalise(username);
  if (!target) {
    return false;
  }

  return message.message.some(part => {
    if (part.type !== 'mention') {
      return false;
    }

    return normalise(part.content.replace(/^@/, '')) === target;
  });
}

function messageMatchesSearch(
  message: VisibleMessageShape,
  searchQuery: string | undefined,
): boolean {
  const query = normalise(searchQuery);
  if (!query) {
    return true;
  }

  const sender = normalise(message.sender);
  const username = normalise(message.userstate.username);
  const login = normalise(message.userstate.login);
  const body = normalise(getMessageText(message));

  return (
    sender.includes(query) ||
    username.includes(query) ||
    login.includes(query) ||
    body.includes(query)
  );
}

function messageHiddenByPhrase(
  message: VisibleMessageShape,
  hiddenPhrases: string[],
): boolean {
  if (hiddenPhrases.length === 0) {
    return false;
  }

  const body = normalise(getMessageText(message));
  return hiddenPhrases.some(phrase => body.includes(normalise(phrase)));
}

function messageHiddenByUser(
  message: VisibleMessageShape,
  hiddenUsers: string[],
): boolean {
  if (hiddenUsers.length === 0) {
    return false;
  }

  const sender = normalise(message.sender);
  const username = normalise(message.userstate.username);
  const login = normalise(message.userstate.login);

  return hiddenUsers.some(hiddenUser => {
    const target = normalise(hiddenUser);
    return target === sender || target === username || target === login;
  });
}

function isOwnMessage(
  message: VisibleMessageShape,
  options: VisibleMessagesOptions,
): boolean {
  const currentUserId = normalise(options.currentUserId);
  const currentUsername = normalise(options.currentUsername);

  return (
    (currentUserId.length > 0 &&
      normalise(message.userstate['user-id']) === currentUserId) ||
    (currentUsername.length > 0 &&
      [message.sender, message.userstate.username, message.userstate.login]
        .map(normalise)
        .includes(currentUsername))
  );
}

export function getVisibleMessages<TMessage extends VisibleMessageShape>(
  messages: TMessage[],
  options: VisibleMessagesOptions = {},
): TMessage[] {
  const hiddenUsers = (options.hiddenUsers ?? [])
    .map(normalise)
    .filter(Boolean);
  const hiddenPhrases = (options.hiddenPhrases ?? [])
    .map(normalise)
    .filter(Boolean);
  const pauseAnchorMessageId = options.pauseAnchorMessageId ?? null;

  let scopedMessages = messages;

  if (pauseAnchorMessageId) {
    const anchorIndex = messages.findIndex(
      message => message.message_id === pauseAnchorMessageId,
    );

    if (anchorIndex >= 0) {
      const beforeAnchor = messages.slice(0, anchorIndex + 1);
      const ownAfterAnchor = messages
        .slice(anchorIndex + 1)
        .filter(message => isOwnMessage(message, options));

      scopedMessages = [...beforeAnchor, ...ownAfterAnchor];
    }
  }

  return scopedMessages.filter(message => {
    if (options.showOnlyMentions) {
      if (!messageMentionsUsername(message, options.currentUsername)) {
        return false;
      }
    }

    if (!messageMatchesSearch(message, options.searchQuery)) {
      return false;
    }

    if (messageHiddenByUser(message, hiddenUsers)) {
      return false;
    }

    if (messageHiddenByPhrase(message, hiddenPhrases)) {
      return false;
    }

    return true;
  });
}

export function getPausedPendingMessageCount<
  TMessage extends VisibleMessageShape,
>(messages: TMessage[], options: VisibleMessagesOptions = {}): number {
  const pauseAnchorMessageId = options.pauseAnchorMessageId ?? null;
  if (!pauseAnchorMessageId) {
    return 0;
  }

  const anchorIndex = messages.findIndex(
    message => message.message_id === pauseAnchorMessageId,
  );

  if (anchorIndex < 0) {
    return 0;
  }

  const afterAnchorMessages = messages.slice(anchorIndex + 1);
  const resumeVisibleMessages = getVisibleMessages(afterAnchorMessages, {
    ...options,
    pauseAnchorMessageId: null,
  });

  return resumeVisibleMessages.filter(
    message => !isOwnMessage(message, options),
  ).length;
}
