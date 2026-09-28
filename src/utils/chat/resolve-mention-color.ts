import { getUserMessageColor } from '@app/store/chat/actions/messages';
import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { cachedLighten } from '@app/utils/chat/resolve-cached-sender-color/cached-lighten';

export function resolveMentionColor(mentionUsername: string): string {
  const stripped = mentionUsername.replace(/^@/, '').trim();

  if (!stripped) {
    return cachedLighten(generateRandomTwitchColor());
  }

  const fromChatHistory = getUserMessageColor(stripped);

  if (fromChatHistory) {
    return cachedLighten(fromChatHistory);
  }

  return cachedLighten(generateRandomTwitchColor(stripped));
}
