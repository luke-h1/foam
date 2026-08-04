import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { cachedLighten } from '@app/utils/chat/resolveCachedSenderColor/cachedLighten';

import { ChatMessagePressable } from './ChatMessagePressable';
import type { ChatFontScale } from './chatScale';
import { getChatTextStyles } from './chatText.styles';
import { PaintedUsername } from './CosmeticUsername/PaintedUsername';
import { styles } from './RichChatMessage.styles';

interface RichChatMessageUsernameProps {
  cachedSenderColor?: string;
  compact: boolean;
  fontScale?: ChatFontScale;
  isModerated?: boolean;
  onUsernamePress?: () => void;
  userId?: string;
  userstateColor?: string;
  username?: string;
}

export function RichChatMessageUsername({
  cachedSenderColor,
  compact,
  fontScale,
  isModerated = false,
  onUsernamePress,
  userId,
  userstateColor,
  username,
}: RichChatMessageUsernameProps) {
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
      onPress={onUsernamePress}
      testID='chat-username-button'
    >
      {paintedUsername}
    </ChatMessagePressable>
  );
}
