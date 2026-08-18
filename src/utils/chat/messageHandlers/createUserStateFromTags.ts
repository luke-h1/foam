import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { parseBadges } from '@app/utils/chat/parseBadges';

export const createUserStateFromTags = (
  tags: Record<string, string>,
): UserStateTags => {
  const badgeData = parseBadges(tags.badges);

  // SAFETY: the required reply-parent fields are all set below, and Twitch only sends 'user-type' as '', 'admin', 'global_mod' or 'staff'.
  return {
    ...tags,
    username: tags['display-name'] || tags.login || '',
    login: tags.login || tags['display-name']?.toLowerCase() || '',
    'badges-raw': badgeData['badges-raw'],
    badges: badgeData.badges,
    'reply-parent-msg-id': tags['reply-parent-msg-id'] || '',
    'reply-parent-msg-body': tags['reply-parent-msg-body'] || '',
    'reply-parent-display-name': tags['reply-parent-display-name'] || '',
    'reply-parent-user-login': tags['reply-parent-user-login'] || '',
    'user-type': tags['user-type'],
  } as UserStateTags;
};
