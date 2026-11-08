import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import { resolveCachedSenderColor } from '@app/utils/chat/resolve-cached-sender-color/resolveCachedSenderColor';

import { ChatMessagePressable } from './ChatMessagePressable';
import { styles } from './ChatRow.styles';
import { getChatTextStyles } from './ChatText.styles';
import { PaintedUsername } from './cosmetic-username/PaintedUsername';
import { CHAT_SURFACE_COLORS } from './util/chatScale';

interface ChatRowUsernameProps {
  cachedSenderColor?: string;
  density: ChatDensity;
  fontScale?: ChatFontScale;
  isModerated?: boolean;
  onUsernamePress?: () => void;
  userId?: string;
  userstateColor?: string;
  username?: string;
}

export function ChatRowUsername({
  cachedSenderColor,
  density,
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
    getChatTextStyles(fontScale, density).username,
    isModerated && styles.moderatedUsernameText,
  ];

  const fallbackColor =
    resolveCachedSenderColor({
      cachedSenderColor,
      sender: username,
      userstate: { color: userstateColor },
    }) ?? CHAT_SURFACE_COLORS.muted;

  const paintedUsername = (
    <PaintedUsername
      {...{ fallbackColor, isModerated, userId, username, usernameTextStyle }}
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
