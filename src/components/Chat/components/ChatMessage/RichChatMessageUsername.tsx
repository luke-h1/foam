import type { StyleProp, TextStyle } from 'react-native';

import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { lightenColor } from '@app/utils/color/lightenColor';

import { ChatMessagePressable } from './ChatMessagePressable';
import { PaintedUsername } from './CosmeticUsername/CosmeticUsername';
import { styles } from './RichChatMessage.styles';

const usernameTextStyles: Record<
  'comfortable' | 'comfortableModerated' | 'compact' | 'compactModerated',
  StyleProp<TextStyle>
> = {
  comfortable: [styles.usernameText],
  comfortableModerated: [styles.usernameText, styles.moderatedUsernameText],
  compact: [styles.usernameTextCompact],
  compactModerated: [styles.usernameTextCompact, styles.moderatedUsernameText],
};

function getUsernameTextStyle(compact: boolean, isModerated: boolean) {
  if (compact && isModerated) {
    return usernameTextStyles.compactModerated;
  }
  if (compact) {
    return usernameTextStyles.compact;
  }
  if (isModerated) {
    return usernameTextStyles.comfortableModerated;
  }
  return usernameTextStyles.comfortable;
}

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
      usernameTextStyle={getUsernameTextStyle(compact, isModerated)}
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
