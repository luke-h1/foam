import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MessageTokenLine } from '@app/components/chat/components/message-token-line/message-token-line';
import { theme } from '@app/styles/themes';
import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import type { MessageToken } from '@app/utils/chat/message-token';
import { lightenColor } from '@app/utils/color/lighten-color';

import { PaintedUsername } from '../chat-message/cosmetic-username/painted-username';

interface MessageActionPreviewProps {
  message: MessageToken[];
  username?: string;
}

export const MessageActionPreview = memo(function MessageActionPreview({
  message,
  username,
}: MessageActionPreviewProps) {
  const previewUsernameColor = username
    ? lightenColor(generateRandomTwitchColor(username))
    : null;

  return (
    <View style={styles.previewCard}>
      <MessageTokenLine tokens={message} style={styles.previewLines}>
        {username ? (
          <PaintedUsername
            username={username}
            fallbackColor={previewUsernameColor ?? undefined}
            usernameTextStyle={styles.previewUsername}
          />
        ) : null}
      </MessageTokenLine>
    </View>
  );
});

const styles = StyleSheet.create({
  /**
   * Three lines at most, so a long message cannot push the actions below the
   * fold when the sheet opens.
   */
  previewLines: {
    maxHeight: 66,
    overflow: 'hidden',
  },
  previewCard: {
    backgroundColor: theme.color.surfaceElevated.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    gap: theme.space8,
    marginBottom: theme.space24,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  previewUsername: {
    fontSize: theme.fontSize16,
    lineHeight: 22,
  },
});
