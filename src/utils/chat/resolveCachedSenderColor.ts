import type { ChatMessageType } from '@app/store/chatStore/constants';
import { getUserMessageColor } from '@app/store/chatStore/messages';
import {
  getSessionCacheString,
  setSessionCacheString,
} from '@app/store/chatStore/chatColorCaches';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { lightenColor } from '@app/utils/color/lightenColor';

type SenderColorMessage = Pick<
  ChatMessageType<never>,
  'cachedSenderColor' | 'sender' | 'userstate'
>;

export function cachedLighten(color: string): string {
  const cached = getSessionCacheString('lightenedColors', color);
  if (cached !== undefined) {
    return cached;
  }

  const lightened = lightenColor(color);
  setSessionCacheString('lightenedColors', color, lightened);
  return lightened;
}

export function resolveCachedSenderColor(
  message: SenderColorMessage,
): string | undefined {
  if (message.cachedSenderColor) {
    return message.cachedSenderColor;
  }

  const ircColor = message.userstate?.color;
  if (ircColor) {
    return cachedLighten(ircColor);
  }

  const login = message.userstate?.login ?? message.sender;
  const indexedColor = login ? getUserMessageColor(login) : undefined;
  if (indexedColor) {
    return cachedLighten(indexedColor);
  }

  const username = message.userstate?.username ?? message.sender;
  if (username) {
    return cachedLighten(generateRandomTwitchColor(username));
  }

  return undefined;
}
