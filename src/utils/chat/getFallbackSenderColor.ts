import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';

export function getFallbackSenderColor(login?: string | null): string {
  return generateRandomTwitchColor(normaliseChatUsername(login) || undefined);
}
