import { getUserMessageColor } from '@app/store/chat/actions/message-color-index';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { getFallbackSenderColor } from '@app/utils/chat/getFallbackSenderColor';
import { cachedLighten } from '@app/utils/chat/resolve-cached-sender-color/cachedLighten';

export function resolveMentionColor(mentionUsername: string): string {
  const login = normaliseChatUsername(mentionUsername);
  const fromChatHistory = login ? getUserMessageColor(login) : undefined;

  return cachedLighten(fromChatHistory || getFallbackSenderColor(login));
}
