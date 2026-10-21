import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { parseBadges } from '@app/utils/chat/parse-badges';

export interface OptimisticSender {
  id?: string | undefined;
  login?: string | undefined;
  display_name?: string | undefined;
}

export interface OptimisticReplyTarget {
  color?: string | undefined;
  messageId: string;
  username: string;
  message: string;
  replyParentUserLogin?: string | undefined;
}

export function createOptimisticUserState({
  currentUserState,
  replyTo,
  user,
}: {
  currentUserState: Record<string, string>;
  replyTo?: OptimisticReplyTarget | null | undefined;
  user?: OptimisticSender | undefined;
}) {
  const badgeData = parseBadges(currentUserState['badges'] || '');

  return {
    ...currentUserState,
    'display-name':
      user?.display_name || currentUserState['display-name'] || '',
    login: user?.login || currentUserState['login'] || '',
    username:
      user?.display_name ||
      user?.login ||
      currentUserState['display-name'] ||
      '',
    'user-id': user?.id || currentUserState['user-id'] || '',
    'badges-raw': badgeData['badges-raw'],
    badges: badgeData.badges,
    color:
      currentUserState['color'] ||
      (user?.login ? generateRandomTwitchColor(user.login) : undefined),
    'reply-parent-msg-id': replyTo?.messageId || '',
    'reply-parent-msg-body': replyTo?.message || '',
    'reply-parent-display-name': replyTo?.username || '',
    'reply-parent-user-login': replyTo?.replyParentUserLogin || '',
  };
}
