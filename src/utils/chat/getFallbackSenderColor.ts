import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';

/**
 * The colour for a chatter with no IRC colour. It hashes the normalised login,
 * so a mention, a row and an optimistic message for one chatter agree.
 */
export function getFallbackSenderColor(login?: string | null): string {
  return generateRandomTwitchColor(normaliseChatUsername(login) || undefined);
}
