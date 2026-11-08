import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MessageTokenLine } from '@app/components/chat/components/message-token-line/MessageTokenLine';
import { theme } from '@app/styles/themes';
import type { MessageToken } from '@app/types/chat/messageToken';

import { PaintedUsername } from '../chat-message/cosmetic-username/PaintedUsername';

const PREVIEW_LINE_HEIGHT = 22;

/**
 * Three lines at most, so a long message cannot push the actions below the
 * fold when the sheet opens.
 */
const PREVIEW_MAX_LINES = 3;

interface MessageActionPreviewProps {
  message: MessageToken[];
  username?: string;
  usernameColor?: string;
}

export const MessageActionPreview = memo(function MessageActionPreview({
  message,
  username,
  usernameColor,
}: MessageActionPreviewProps) {
  return (
    <View style={styles.previewCard}>
      <MessageTokenLine
        tokens={message}
        style={styles.previewLines}
        textStyle={styles.previewText}
      >
        {username ? (
          <PaintedUsername
            isModerated={false}
            {...{
              username,
              fallbackColor: usernameColor,
              usernameTextStyle: styles.previewUsername,
            }}
          />
        ) : null}
      </MessageTokenLine>
    </View>
  );
});

const styles = StyleSheet.create({
  previewLines: {
    maxHeight: PREVIEW_MAX_LINES * PREVIEW_LINE_HEIGHT,
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
  previewText: {
    lineHeight: PREVIEW_LINE_HEIGHT,
  },
  previewUsername: {
    fontSize: theme.fontSize16,
    lineHeight: PREVIEW_LINE_HEIGHT,
  },
});
