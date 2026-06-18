import { twitchApi } from '@app/services/api/clients';
import {
  twitchService,
  type UserInfoResponse,
} from '@app/services/twitch-service';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { clearSessionCache } from '@app/store/chat/actions/chatColorCaches';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { logger } from '@app/utils/logger';

import {
  getMentionLogin,
  registerMentionChatter,
  registerMentionLogin,
} from './resolveMentionLogin';

const pendingLogins = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_DELAY_MS = 400;
const MAX_LOGINS_PER_REQUEST = 100;
const MENTION_SEARCH_DELAY_MS = 300;
const MIN_REMOTE_MENTION_SEARCH_LENGTH = 2;

let mentionSearchTimer: ReturnType<typeof setTimeout> | null = null;
let mentionSearchRequestId = 0;
let lastMentionSearchQuery = '';

const TWITCH_LOGIN_PATTERN = /^[a-zA-Z0-9_]{1,25}$/;

function extractTwitchLogin(value: string): string {
  return value.match(/^([a-zA-Z0-9_]{1,25})(?![a-zA-Z0-9_])/)?.[1] ?? '';
}

function bumpMentionLoginRevision(): void {
  clearSessionCache('mentionColors');
  chatStore$.mentionLoginRevision.set(revision => (revision ?? 0) + 1);
}

function scheduleMentionLoginFlush(): void {
  if (flushTimer) {
    return;
  }

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPendingMentionLogins();
  }, FLUSH_DELAY_MS);
}

async function flushPendingMentionLogins(): Promise<void> {
  if (pendingLogins.size === 0) {
    return;
  }

  const logins = [...pendingLogins]
    .filter(login => TWITCH_LOGIN_PATTERN.test(login))
    .slice(0, MAX_LOGINS_PER_REQUEST);
  const selected = new Set(logins);
  pendingLogins.forEach(login => {
    if (!TWITCH_LOGIN_PATTERN.test(login) || selected.has(login)) {
      pendingLogins.delete(login);
    }
  });

  if (logins.length === 0) {
    return;
  }

  try {
    const params = new URLSearchParams();
    logins.forEach(login => {
      params.append('login', login);
    });

    const result = await twitchApi.get<{ data: UserInfoResponse[] }>(
      `/users?${params.toString()}`,
    );

    let didRegister = false;
    result.data?.forEach(user => {
      if (!user.login) {
        return;
      }

      const before = getMentionLogin(user.login);
      registerMentionChatter({
        login: user.login,
        userId: user.id,
        color: generateRandomTwitchColor(user.login),
      });
      if (getMentionLogin(user.login) !== before) {
        didRegister = true;
      }
    });

    if (didRegister) {
      bumpMentionLoginRevision();
    }
  } catch (error) {
    logger.chat.debug('Failed to resolve mention logins from Helix:', error);
  }

  if (pendingLogins.size > 0) {
    scheduleMentionLoginFlush();
  }
}

function queueMentionLoginLookup(login?: string | null): void {
  const trimmed = extractTwitchLogin(login?.trim() ?? '');
  if (!trimmed) {
    return;
  }

  if (trimmed !== trimmed.toLowerCase()) {
    registerMentionLogin(trimmed);
    return;
  }

  const canonical = getMentionLogin(trimmed);
  if (canonical !== trimmed.toLowerCase()) {
    return;
  }

  pendingLogins.add(trimmed.toLowerCase());
  scheduleMentionLoginFlush();
}

export function queueMentionLoginsFromParts(
  parts: { type: string; content?: string }[],
): void {
  parts.forEach(part => {
    if (part.type !== 'mention' || !part.content) {
      return;
    }

    queueMentionLoginLookup(part.content.replace(/^@/, ''));
  });
}

async function searchMentionLoginsRemote(query: string): Promise<boolean> {
  const channels = await twitchService.searchChannels(query);
  let didRegister = false;

  channels.forEach(channel => {
    const login = channel.broadcaster_login?.trim();
    if (!login) {
      return;
    }

    const before = getMentionLogin(login);
    registerMentionChatter({
      login,
      userId: channel.id,
      color: generateRandomTwitchColor(login),
    });
    if (getMentionLogin(login) !== before) {
      didRegister = true;
    }
  });

  return didRegister;
}

export function queueMentionLoginSearch(query: string): void {
  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length < MIN_REMOTE_MENTION_SEARCH_LENGTH) {
    return;
  }

  if (trimmedQuery === lastMentionSearchQuery && mentionSearchTimer) {
    return;
  }

  lastMentionSearchQuery = trimmedQuery;

  if (mentionSearchTimer) {
    clearTimeout(mentionSearchTimer);
  }

  mentionSearchTimer = setTimeout(() => {
    mentionSearchTimer = null;
    const requestId = ++mentionSearchRequestId;

    void searchMentionLoginsRemote(trimmedQuery)
      .then(didRegister => {
        if (requestId !== mentionSearchRequestId) {
          return;
        }

        if (didRegister) {
          bumpMentionLoginRevision();
        }
      })
      .catch(error => {
        logger.chat.debug('Failed to search mention logins:', error);
      });
  }, MENTION_SEARCH_DELAY_MS);
}

export function resetMentionLoginResolver(): void {
  pendingLogins.clear();
  lastMentionSearchQuery = '';
  mentionSearchRequestId += 1;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (mentionSearchTimer) {
    clearTimeout(mentionSearchTimer);
    mentionSearchTimer = null;
  }
}
