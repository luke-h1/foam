import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { Button as PressableButton } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/PaintedUsername';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { lightenColor } from '@app/utils/color/lightenColor';
import { truncate } from '@app/utils/string/truncate';

import { chatEntranceSpring } from '../util/chatEntranceSpring';
import type { ReplyToData } from '../util/chatInputSectionTypes';
import { COMPOSER_CONTROL_RADIUS } from '../util/composerSizing';
import { ReplyPreviewBody } from './ReplyPreviewBody';

const replyPreviewEntering = chatEntranceSpring(FadeInUp);
const replyPreviewExiting = FadeOutDown.duration(140);

interface GlassReplyPreviewProps {
  onClearReply: () => void;
  replyTo: ReplyToData;
}

/**
 * The card the iOS composer shows above the input while the user replies to a
 * message. It sits on liquid glass where the OS has it and falls back to a
 * blur elsewhere.
 */
export const GlassReplyPreview = memo(
  ({ onClearReply, replyTo }: GlassReplyPreviewProps) => {
    return (
      <Animated.View
        entering={replyPreviewEntering}
        exiting={replyPreviewExiting}
        style={styles.replyShell}
      >
        {isLiquidGlassAvailable() ? (
          <GlassView
            glassEffectStyle='clear'
            colorScheme='dark'
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <BlurView
            intensity={32}
            style={StyleSheet.absoluteFill}
            tint='dark'
          />
        )}
        <View style={styles.replyIndicator} />
        <View style={styles.replyContent}>
          <View style={styles.replyLabelRow}>
            <Text style={styles.replyLabel}>Replying to</Text>
            <PaintedUsername
              fallbackColor={
                replyTo.color ? lightenColor(replyTo.color) : undefined
              }
              showColon={false}
              userId={replyTo.userId}
              username={replyTo.username}
              usernameTextStyle={styles.replyPaintedUsername}
            />
          </View>
          <ReplyPreviewLine replyTo={replyTo} />
        </View>
        <PressableButton
          onPress={onClearReply}
          style={styles.replyDismissButton}
        >
          <SymbolView tintColor={theme.colorWhite} name='xmark' size={16} />
        </PressableButton>
      </Animated.View>
    );
  },
);

const ReplyPreviewLine = ({ replyTo }: { replyTo: ReplyToData }) => {
  if (replyTo.messageParts?.length) {
    return (
      <ReplyPreviewBody
        parts={replyTo.messageParts}
        textStyle={styles.replyMessagePreview}
      />
    );
  }

  if (!replyTo.message) {
    return null;
  }

  return (
    <Text numberOfLines={1} style={styles.replyMessagePreview}>
      {truncate(replyTo.message.trim() || replyTo.message, 72)}
    </Text>
  );
};

const styles = StyleSheet.create({
  replyContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  replyDismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    minHeight: 28,
    minWidth: 28,
  },
  replyIndicator: {
    alignSelf: 'stretch',
    backgroundColor: theme.colorViolet,
    borderCurve: 'continuous',
    borderRadius: 999,
    width: 3,
  },
  replyLabel: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: theme.fontSize12,
  },
  replyLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  replyMessagePreview: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: theme.fontSize14,
  },
  replyPaintedUsername: {
    fontSize: theme.fontSize12,
    fontWeight: '700',
  },
  replyShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,12,0.74)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: COMPOSER_CONTROL_RADIUS,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    marginHorizontal: theme.space12,
    overflow: 'hidden',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
