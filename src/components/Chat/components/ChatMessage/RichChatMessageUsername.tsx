import { type StyleProp, type TextStyle, useColorScheme } from 'react-native';

import type { ColorScheme } from '@app/styles/themes';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { cachedLighten } from '@app/utils/chat/resolveCachedSenderColor/cachedLighten';

import { ChatMessagePressable } from './ChatMessagePressable';
import { PaintedUsername } from './CosmeticUsername/PaintedUsername';
import { getRichChatMessageStyles } from './RichChatMessage.styles';

type UsernameTextStyles = Record<
  'comfortable' | 'comfortableModerated' | 'compact' | 'compactModerated',
  StyleProp<TextStyle>
>;

function buildUsernameTextStyles(scheme: ColorScheme): UsernameTextStyles {
  const styles = getRichChatMessageStyles(scheme);
  return {
    comfortable: [styles.usernameText],
    comfortableModerated: [styles.usernameText, styles.moderatedUsernameText],
    compact: [styles.usernameTextCompact],
    compactModerated: [
      styles.usernameTextCompact,
      styles.moderatedUsernameText,
    ],
  };
}

const usernameTextStylesByScheme = {
  light: buildUsernameTextStyles('light'),
  dark: buildUsernameTextStyles('dark'),
} as const;

function getUsernameTextStyle(
  scheme: ColorScheme,
  compact: boolean,
  isModerated: boolean,
) {
  const usernameTextStyles = usernameTextStylesByScheme[scheme];
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  if (!username) {
    return null;
  }

  const fallbackColor =
    cachedSenderColor ??
    (userstateColor ? cachedLighten(userstateColor) : undefined) ??
    cachedLighten(generateRandomTwitchColor(username));

  const paintedUsername = (
    <PaintedUsername
      username={username}
      userId={userId}
      fallbackColor={fallbackColor}
      usernameTextStyle={getUsernameTextStyle(scheme, compact, isModerated)}
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
