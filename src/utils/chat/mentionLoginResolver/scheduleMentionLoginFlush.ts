import { twitchApi } from '@app/services/api/clients';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { bumpMentionLoginRevision } from '@app/utils/chat/mentionLoginResolver/bumpMentionLoginRevision';
import { flushTimer } from '@app/utils/chat/mentionLoginResolver/flushTimer';
import { pendingLogins } from '@app/utils/chat/mentionLoginResolver/pendingLogins';
import { getMentionLogin } from '@app/utils/chat/resolveMentionLogin/getMentionLogin';
import { registerMentionChatter } from '@app/utils/chat/resolveMentionLogin/registerMentionChatter';
import { logger } from '@app/utils/logger';

const FLUSH_DELAY_MS = 400;
const MAX_LOGINS_PER_REQUEST = 100;

const TWITCH_LOGIN_PATTERN = /^[a-zA-Z0-9_]{1,25}$/;

export function scheduleMentionLoginFlush(): void {
  if (flushTimer.current) {
    return;
  }

  flushTimer.current = setTimeout(() => {
    flushTimer.current = null;
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
