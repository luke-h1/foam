import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { lightenColor } from '@app/utils/color/lightenColor';

import { ChatMessagePressable } from './ChatMessagePressable';
import { PaintedUsername } from './CosmeticUsername/CosmeticUsername';
import { styles } from './RichChatMessage.styles';

interface RichChatMessageUsernameProps {
  cachedSenderColor?: string;
  compact: boolean;
  isModerated?: boolean;
  onUsernamePress?: () => void;
  userId?: string;
  userstateColor?: string;
  username?: string;
}

export function RichChatMessageUsername({
  cachedSenderColor,
  compact,
  isModerated = false,
  onUsernamePress,
  userId,
  userstateColor,
  username,
}: RichChatMessageUsernameProps) {
  if (!username) {
    return null;
  }

  const fallbackColor =
    cachedSenderColor ??
    (userstateColor ? lightenColor(userstateColor) : undefined) ??
    lightenColor(generateRandomTwitchColor(username));

  const paintedUsername = (
    <PaintedUsername
      username={username}
      userId={userId}
      fallbackColor={fallbackColor}
      usernameTextStyle={[
        compact ? styles.usernameTextCompact : styles.usernameText,
        isModerated && styles.moderatedUsernameText,
      ]}
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
