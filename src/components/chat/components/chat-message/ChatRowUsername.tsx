import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { cachedLighten } from '@app/utils/chat/resolve-cached-sender-color/cachedLighten';

import { ChatMessagePressable } from './ChatMessagePressable';
import { styles } from './ChatRow.styles';
import { getChatTextStyles } from './ChatText.styles';
import { PaintedUsername } from './cosmetic-username/PaintedUsername';
import type { ChatFontScale } from './util/chatScale';

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
      {...{ username, userId, fallbackColor, usernameTextStyle }}
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
