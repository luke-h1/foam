import { twitchService } from '@app/services/twitch-service';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { bumpMentionLoginRevision } from '@app/utils/chat/mentionLoginResolver/bumpMentionLoginRevision';
import { lastMentionSearchQuery } from '@app/utils/chat/mentionLoginResolver/lastMentionSearchQuery';
import { mentionSearchRequestId } from '@app/utils/chat/mentionLoginResolver/mentionSearchRequestId';
import { mentionSearchTimer } from '@app/utils/chat/mentionLoginResolver/mentionSearchTimer';
import { getMentionLogin } from '@app/utils/chat/resolveMentionLogin/getMentionLogin';
import { registerMentionChatter } from '@app/utils/chat/resolveMentionLogin/registerMentionChatter';
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
  const trimmedQuery = query.trim().toLowerCase();
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
          bumpMentionLoginRevision();
        }
      })
      .catch(error => {
        logger.chat.debug('Failed to search mention logins:', error);
      });
  }, MENTION_SEARCH_DELAY_MS);
}
