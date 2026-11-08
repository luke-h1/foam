import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';

export const SYSTEM_SENDER = 'System';

export const SYSTEM_SENDER_LOGIN = 'system';

export function isSystemSender(sender: string | undefined): boolean {
  return normaliseChatUsername(sender) === SYSTEM_SENDER_LOGIN;
}
