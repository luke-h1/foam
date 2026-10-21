import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { cachedLighten } from '@app/utils/chat/resolve-cached-sender-color/cached-lighten';

type SenderColorMessage = {
  cachedSenderColor?: string | undefined;
  sender: string;
  userstate?: {
    color?: string | undefined;
    login?: string | undefined;
    username?: string | undefined;
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
