import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

const messageTextCache = new WeakMap<ParsedPart[], string>();
const normalisedMessageFieldsCache = new WeakMap<
  VisibleMessageShape,
  {
    body: string;
    login: string;
    sender: string;
    username: string;
  }
>();

interface VisibleMessageShape {
  message: ParsedPart[];
  message_id: string;
  sender: string;
  userstate: UserStateTags;
}

export interface VisibleMessagesOptions {
  currentUsername?: string;
  hiddenPhrases?: string[];
  hiddenUsers?: string[];
  searchQuery?: string;
  showOnlyMentions?: boolean;
}

function normalise(value: string | undefined | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function getMessageText(message: VisibleMessageShape): string {
  const cached = messageTextCache.get(message.message);
  if (cached) {
    return cached;
  }

  const text = replaceEmotesWithText(message.message);
  messageTextCache.set(message.message, text);
  return text;
}

function getNormalisedMessageFields(message: VisibleMessageShape) {
  const cached = normalisedMessageFieldsCache.get(message);
  if (cached) {
    return cached;
  }

  const fields = {
    body: normalise(getMessageText(message)),
    login: normalise(message.userstate.login),
    sender: normalise(message.sender),
    username: normalise(message.userstate.username),
  };

  normalisedMessageFieldsCache.set(message, fields);
  return fields;
}

function messageMentionsUsername(
  message: VisibleMessageShape,
  username: string | undefined,
): boolean {
  const target = normalise(username);
  if (!target) {
    return false;
  }

  for (const part of message.message) {
    if (part.type !== 'mention') {
      continue;
    }

    if (normalise(part.content.replace(/^@/, '')) === target) {
      return true;
    }
  }

  return false;
}

function messageMatchesSearch(
  message: VisibleMessageShape,
  searchQuery: string,
): boolean {
  if (!searchQuery) {
    return true;
  }

  const { sender, username, login, body } = getNormalisedMessageFields(message);

  return (
    sender.includes(searchQuery) ||
    username.includes(searchQuery) ||
    login.includes(searchQuery) ||
    body.includes(searchQuery)
  );
}

function messageHiddenByPhrase(
  message: VisibleMessageShape,
  hiddenPhrases: readonly string[],
): boolean {
  if (hiddenPhrases.length === 0) {
    return false;
  }

  const { body } = getNormalisedMessageFields(message);

  for (const phrase of hiddenPhrases) {
    if (body.includes(phrase)) {
      return true;
    }
  }

  return false;
}

function messageHiddenByUser(
  message: VisibleMessageShape,
  hiddenUsers: ReadonlySet<string>,
): boolean {
  if (hiddenUsers.size === 0) {
    return false;
  }

  const { sender, username, login } = getNormalisedMessageFields(message);

  return (
    hiddenUsers.has(sender) ||
    hiddenUsers.has(username) ||
    hiddenUsers.has(login)
  );
}

function normaliseList(values: string[] | undefined): string[] {
  if (!values || values.length === 0) {
    return [];
  }

  const normalisedValues: string[] = [];

  for (const value of values) {
    const normalisedValue = normalise(value);
    if (normalisedValue) {
      normalisedValues.push(normalisedValue);
    }
  }

  return normalisedValues;
}

export function getVisibleMessages<TMessage extends VisibleMessageShape>(
  messages: TMessage[],
  options: VisibleMessagesOptions = {},
): TMessage[] {
  const searchQuery = normalise(options.searchQuery);
  const showOnlyMentions = options.showOnlyMentions === true;
  const hiddenUsers = new Set(normaliseList(options.hiddenUsers));
  const hiddenPhrases = normaliseList(options.hiddenPhrases);
  const hasSearch = searchQuery.length > 0;
  const hasHiddenUsers = hiddenUsers.size > 0;
  const hasHiddenPhrases = hiddenPhrases.length > 0;

  if (!showOnlyMentions && !hasSearch && !hasHiddenUsers && !hasHiddenPhrases) {
    return messages;
  }

  return messages.filter(message => {
    if (showOnlyMentions) {
      if (!messageMentionsUsername(message, options.currentUsername)) {
        return false;
      }
    }

    if (!messageMatchesSearch(message, searchQuery)) {
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
