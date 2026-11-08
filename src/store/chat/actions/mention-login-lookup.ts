import { twitchService } from '@app/services/twitch-service';
import { invalidateMentionColors } from '@app/store/chat/actions/invalidation';
import type { MessageToken } from '@app/types/chat/messageToken';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { stripMentionPrefix } from '@app/utils/chat/chat-usernames/stripMentionPrefix';
import { isTwitchLogin } from '@app/utils/chat/chat-usernames/twitchLogin';
import { clearMentionIndexes } from '@app/utils/chat/resolve-mention-login/clearMentionIndexes';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/getMentionLogin';
import { registerMentionChatter } from '@app/utils/chat/resolve-mention-login/registerMentionChatter';
import { registerMentionLogin } from '@app/utils/chat/resolve-mention-login/registerMentionLogin';
import { logger } from '@app/utils/logger';

const FLUSH_DELAY_MS = 400;
const MAX_LOGINS_PER_REQUEST = 100;
const MENTION_SEARCH_DELAY_MS = 300;
const MIN_REMOTE_MENTION_SEARCH_LENGTH = 2;

interface MentionLookupState {
  pendingLogins: Set<string>;
  flushTimer: ReturnType<typeof setTimeout> | null;
  searchTimer: ReturnType<typeof setTimeout> | null;
  lastSearchQuery: string;
  searchRequestId: number;
  generation: number;
}

const mentionLookupState: MentionLookupState = {
  pendingLogins: new Set(),
  flushTimer: null,
  searchTimer: null,
  lastSearchQuery: '',
  searchRequestId: 0,
  generation: 0,
};

interface ResolvedChatter {
  login?: string;
  id?: string;
}

function registerResolvedChatters(chatters: ResolvedChatter[]): void {
  let didRegister = false;

  chatters.forEach(chatter => {
    const login = chatter.login?.trim();

    if (!login) {
      return;
    }

    const before = getMentionLogin(login);

    registerMentionChatter({ login, userId: chatter.id });

    if (getMentionLogin(login) !== before) {
      didRegister = true;
    }
  });

  if (didRegister) {
    invalidateMentionColors();
  }
}

function scheduleMentionLoginFlush(): void {
  if (mentionLookupState.flushTimer) {
    return;
  }

  mentionLookupState.flushTimer = setTimeout(() => {
    mentionLookupState.flushTimer = null;
    void flushPendingMentionLogins();
  }, FLUSH_DELAY_MS);
}

function takePendingLogins(): string[] {
  const logins = [...mentionLookupState.pendingLogins]
    .filter(login => isTwitchLogin(login))
    .slice(0, MAX_LOGINS_PER_REQUEST);

  const selected = new Set(logins);

  mentionLookupState.pendingLogins.forEach(login => {
    if (!isTwitchLogin(login) || selected.has(login)) {
      mentionLookupState.pendingLogins.delete(login);
    }
  });

  return logins;
}

async function flushPendingMentionLogins(): Promise<void> {
  const logins = takePendingLogins();

  if (logins.length === 0) {
    return;
  }

  const generation = mentionLookupState.generation;

  try {
    const users = await twitchService.getUsersByLogin(logins);

    if (generation === mentionLookupState.generation) {
      registerResolvedChatters(users);
    }
  } catch (error) {
    logger.chat.debug('Failed to resolve mention logins from Helix:', error);
  }

  if (mentionLookupState.pendingLogins.size > 0) {
    scheduleMentionLoginFlush();
  }
}

export function registerMentionLoginsFromTokens(tokens: MessageToken[]): void {
  tokens.forEach(token => {
    if (token.type !== 'mention') {
      return;
    }

    const login = stripMentionPrefix(token.content);

    if (!isTwitchLogin(login)) {
      return;
    }

    registerMentionLogin(login);

    const lowercaseLogin = login.toLowerCase();

    if (login !== lowercaseLogin || getMentionLogin(login) !== lowercaseLogin) {
      return;
    }

    mentionLookupState.pendingLogins.add(lowercaseLogin);
    scheduleMentionLoginFlush();
  });
}

export function queueMentionLoginSearch(query: string): void {
  const trimmedQuery = normaliseChatUsername(query);

  if (trimmedQuery.length < MIN_REMOTE_MENTION_SEARCH_LENGTH) {
    return;
  }

  if (
    trimmedQuery === mentionLookupState.lastSearchQuery &&
    mentionLookupState.searchTimer
  ) {
    return;
  }

  mentionLookupState.lastSearchQuery = trimmedQuery;

  if (mentionLookupState.searchTimer) {
    clearTimeout(mentionLookupState.searchTimer);
  }

  mentionLookupState.searchTimer = setTimeout(() => {
    mentionLookupState.searchTimer = null;
    const requestId = ++mentionLookupState.searchRequestId;
    const generation = mentionLookupState.generation;

    void twitchService
      .searchChannels(trimmedQuery)
      .then(channels => {
        const isCurrent =
          requestId === mentionLookupState.searchRequestId &&
          generation === mentionLookupState.generation;

        if (!isCurrent) {
          return;
        }

        registerResolvedChatters(
          channels.map(channel => ({
            login: channel.broadcaster_login,
            id: channel.id,
          })),
        );
      })
      .catch(error => {
        logger.chat.debug('Failed to search mention logins:', error);
      });
  }, MENTION_SEARCH_DELAY_MS);
}

export function resetMentionLogins(): void {
  clearMentionIndexes();
  mentionLookupState.pendingLogins.clear();
  mentionLookupState.lastSearchQuery = '';
  mentionLookupState.generation += 1;

  if (mentionLookupState.flushTimer) {
    clearTimeout(mentionLookupState.flushTimer);
    mentionLookupState.flushTimer = null;
  }

  if (mentionLookupState.searchTimer) {
    clearTimeout(mentionLookupState.searchTimer);
    mentionLookupState.searchTimer = null;
  }
}
