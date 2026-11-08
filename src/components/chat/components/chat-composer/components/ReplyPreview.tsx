import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { Button } from '@app/components/button/Button';
import { PaintedUsername } from '@app/components/chat/components/chat-message/cosmetic-username/PaintedUsername';
import type { ReplyToData } from '@app/components/chat/components/ChatInputSection.types';
import { chatEntranceSpring } from '@app/components/chat/util/chatEntranceSpring';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';
import { lightenColor } from '@app/utils/color/lightenColor';
import { createHitslop } from '@app/utils/string/createHitSlop';
import { truncate } from '@app/utils/string/truncate';

import { ReplyPreviewBody } from './ReplyPreviewBody';
import { ReplyPreviewChrome } from './ReplyPreviewChrome';

const replyPreviewEntering = chatEntranceSpring(FadeInUp);
const replyPreviewExiting = FadeOutDown.duration(140);

const MESSAGE_LINE_HEIGHT = 20;

/**
 * 36pt with a 20pt hit slop gives a touch target above the 44pt minimum.
 */
const DISMISS_BUTTON_SIZE = 36;

function ReplyPreviewMessage({ replyTo }: { replyTo: ReplyToData }) {
  if (replyTo.messageParts?.length) {
    return (
      <ReplyPreviewBody
        lineHeight={MESSAGE_LINE_HEIGHT}
        textStyle={styles.messagePreview}
        tokens={replyTo.messageParts}
      />
    );
  }

  if (!replyTo.message) {
    return null;
  }

  return (
    <Text
      type='callout'
      family='brand'
      numberOfLines={1}
      style={styles.messagePreview}
    >
      {truncate(replyTo.message.trim() || replyTo.message, 72)}
    </Text>
  );
}

interface ReplyPreviewProps {
  onClearReply: () => void;
  replyTo: ReplyToData;
}

export const ReplyPreview = memo(function ReplyPreview({
  onClearReply,
  replyTo,
}: ReplyPreviewProps) {
  return (
    <Animated.View
      entering={replyPreviewEntering}
      exiting={replyPreviewExiting}
    >
      <ReplyPreviewChrome>
        <View style={styles.indicator} />
        <View style={styles.content}>
          <View style={styles.labelRow}>
            <Text type='callout' family='brand' style={styles.label}>
              Replying to
            </Text>
            <PaintedUsername
              showColon={false}
              {...{
                fallbackColor: replyTo.color
                  ? lightenColor(replyTo.color)
                  : undefined,
                isModerated: false,
                userId: replyTo.userId,
                username: replyTo.username,
                usernameTextStyle: styles.paintedUsername,
              }}
            />
          </View>
          <ReplyPreviewMessage replyTo={replyTo} />
        </View>
        <Button
          accessibilityLabel='Cancel reply'
          hitSlop={createHitslop(20)}
          onPress={onClearReply}
          style={styles.dismissButton}
        >
          <SymbolView
            name='xmark'
            size={16}
            tintColor={theme.colorGreyHoverAlpha}
          />
        </Button>
      </ReplyPreviewChrome>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  dismissButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderRadius: DISMISS_BUTTON_SIZE / 2,
    borderWidth: 1,
    height: DISMISS_BUTTON_SIZE,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: DISMISS_BUTTON_SIZE,
  },
  indicator: {
    alignSelf: 'stretch',
    backgroundColor: theme.colorViolet,
    borderCurve: 'continuous',
    borderRadius: 999,
    width: 3,
  },
  label: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: theme.fontSize12,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  messagePreview: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: theme.fontSize14,
    lineHeight: MESSAGE_LINE_HEIGHT,
  },
  paintedUsername: {
    fontSize: theme.fontSize12,
    fontWeight: '700',
  },
});
