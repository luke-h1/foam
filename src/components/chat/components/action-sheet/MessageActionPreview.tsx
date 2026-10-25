import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MessageTokenLine } from '@app/components/chat/components/message-token-line/MessageTokenLine';
import { theme } from '@app/styles/themes';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import type { MessageToken } from '@app/utils/chat/messageToken';
import { lightenColor } from '@app/utils/color/lightenColor';

import { PaintedUsername } from '../chat-message/cosmetic-username/PaintedUsername';

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
            {...{
              username,
              fallbackColor: previewUsernameColor ?? undefined,
              usernameTextStyle: styles.previewUsername,
            }}
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
