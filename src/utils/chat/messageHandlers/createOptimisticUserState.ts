import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { parseBadges } from '@app/utils/chat/parseBadges';

export interface OptimisticSender {
  id?: string;
  login?: string;
  display_name?: string;
}

export interface OptimisticReplyTarget {
  color?: string;
  messageId: string;
  username: string;
  message: string;
  replyParentUserLogin?: string;
}

/**
 * Userstate for the local echo of a message the user just sent. IRC will
 * eventually echo the real tags back, but the row has to render immediately,
 * so this fills the gaps from the authenticated user and the last USERSTATE.
 */
export function createOptimisticUserState({
  currentUserState,
  replyTo,
  user,
}: {
  currentUserState: Record<string, string>;
  replyTo?: OptimisticReplyTarget | null;
  user?: OptimisticSender;
}) {
  const badgeData = parseBadges(currentUserState.badges || '');

  return {
    ...currentUserState,
    'display-name':
      user?.display_name || currentUserState['display-name'] || '',
    login: user?.login || currentUserState.login || '',
    username:
      user?.display_name ||
      user?.login ||
      currentUserState['display-name'] ||
      '',
    'user-id': user?.id || currentUserState['user-id'] || '',
    'badges-raw': badgeData['badges-raw'],
    badges: badgeData.badges,
    color:
      currentUserState.color ||
      (user?.login ? generateRandomTwitchColor(user.login) : undefined),
    'reply-parent-msg-id': replyTo?.messageId || '',
    'reply-parent-msg-body': replyTo?.message || '',
    'reply-parent-display-name': replyTo?.username || '',
    'reply-parent-user-login': replyTo?.replyParentUserLogin || '',
  };
}
