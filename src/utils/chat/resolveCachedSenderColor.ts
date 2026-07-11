import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { cachedLighten } from '@app/utils/chat/resolveCachedSenderColor/cachedLighten';

type SenderColorMessage = {
  cachedSenderColor?: string;
  sender: string;
  userstate?: {
    color?: string;
    login?: string;
    username?: string;
  };
};

type SenderColorLookup = (username: string) => string | undefined;

export function resolveCachedSenderColor(
  message: SenderColorMessage,
  getIndexedSenderColor?: SenderColorLookup,
): string | undefined {
  if (message.cachedSenderColor) {
    return message.cachedSenderColor;
  }

  const ircColor = message.userstate?.color;
  if (ircColor) {
    return cachedLighten(ircColor);
  }

  const login = message.userstate?.login ?? message.sender;
  const indexedColor = login ? getIndexedSenderColor?.(login) : undefined;
  if (indexedColor) {
    return cachedLighten(indexedColor);
  }

  const username = message.userstate?.username ?? message.sender;
  if (username) {
    return cachedLighten(generateRandomTwitchColor(username));
  }

  return undefined;
}
