import { twitchService } from '@app/services/twitch-service';
import { invalidateMentionColors } from '@app/store/chat/actions/invalidation';
import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { lastMentionSearchQuery } from '@app/utils/chat/mention-login-resolver/last-mention-search-query';
import { mentionSearchRequestId } from '@app/utils/chat/mention-login-resolver/mention-search-request-id';
import { mentionSearchTimer } from '@app/utils/chat/mention-login-resolver/mention-search-timer';
import { normaliseChatText } from '@app/utils/chat/normalise-chat-text';
import { getMentionLogin } from '@app/utils/chat/resolve-mention-login/get-mention-login';
import { registerMentionChatter } from '@app/utils/chat/resolve-mention-login/register-mention-chatter';
import { logger } from '@app/utils/logger';

const MENTION_SEARCH_DELAY_MS = 300;
const MIN_REMOTE_MENTION_SEARCH_LENGTH = 2;

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
  const trimmedQuery = normaliseChatText(query);

  if (trimmedQuery.length < MIN_REMOTE_MENTION_SEARCH_LENGTH) {
    return;
  }

  if (
    trimmedQuery === lastMentionSearchQuery.current &&
    mentionSearchTimer.current
  ) {
    return;
  }

  lastMentionSearchQuery.current = trimmedQuery;

  if (mentionSearchTimer.current) {
    clearTimeout(mentionSearchTimer.current);
  }

  mentionSearchTimer.current = setTimeout(() => {
    mentionSearchTimer.current = null;
    const requestId = ++mentionSearchRequestId.current;

    void searchMentionLoginsRemote(trimmedQuery)
      .then(didRegister => {
        if (requestId !== mentionSearchRequestId.current) {
          return;
        }

        if (didRegister) {
          invalidateMentionColors();
        }
      })
      .catch(error => {
        logger.chat.debug('Failed to search mention logins:', error);
      });
  }, MENTION_SEARCH_DELAY_MS);
}
