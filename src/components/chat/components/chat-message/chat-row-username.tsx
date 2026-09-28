import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { cachedLighten } from '@app/utils/chat/resolve-cached-sender-color/cached-lighten';

import { ChatMessagePressable } from './chat-message-pressable';
import { styles } from './chat-row.styles';
import { getChatTextStyles } from './chat-text.styles';
import { PaintedUsername } from './cosmetic-username/painted-username';
import type { ChatFontScale } from './util/chat-scale';

interface ChatRowUsernameProps {
  cachedSenderColor?: string;
  compact: boolean;
  fontScale?: ChatFontScale;
  isModerated?: boolean;
  onUsernamePress?: () => void;
  userId?: string;
  userstateColor?: string;
  username?: string;
}

export function ChatRowUsername({
  cachedSenderColor,
  compact,
  fontScale,
  isModerated = false,
  onUsernamePress,
  userId,
  userstateColor,
  username,
}: ChatRowUsernameProps) {
  if (!username) {
    return null;
  }

  const usernameTextStyle = [
    getChatTextStyles(fontScale, compact).username,
    isModerated && styles.moderatedUsernameText,
  ];

  const fallbackColor =
    cachedSenderColor ??
    (userstateColor ? cachedLighten(userstateColor) : undefined) ??
    cachedLighten(generateRandomTwitchColor(username));

  const paintedUsername = (
    <PaintedUsername
      username={username}
      userId={userId}
      fallbackColor={fallbackColor}
      usernameTextStyle={usernameTextStyle}
    />
  );

  if (!onUsernamePress) {
    return paintedUsername;
  }

  return (
    <ChatMessagePressable
      accessibilityLabel={username}
      onPress={onUsernamePress}
      testID='chat-username-button'
    >
      {paintedUsername}
    </ChatMessagePressable>
  );
}
