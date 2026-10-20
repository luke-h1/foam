import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { Text } from '@app/components/ui/text/text';
import type { WhisperMessage } from '@app/store/chat/types/whispers';
import { theme } from '@app/styles/themes';

interface WhisperBubbleProps {
  message: WhisperMessage;
}

export const WhisperBubble = memo(function WhisperBubble({
  message,
}: WhisperBubbleProps) {
  const liquidGlass = isLiquidGlassAvailable();

  return (
    <View
      style={[
        styles.row,
        message.isOutgoing ? styles.rowOutgoing : styles.rowIncoming,
      ]}
    >
      <View
        style={[
          styles.bubble,
          message.isOutgoing ? styles.bubbleOutgoing : styles.bubbleIncoming,
        ]}
      >
        {!message.isOutgoing && liquidGlass ? (
          <GlassView
            glassEffectStyle='regular'
            colorScheme='dark'
            style={StyleSheet.absoluteFill}
          />
        ) : null}

        {!message.isOutgoing && !liquidGlass ? (
          <BlurView
            intensity={28}
            tint='dark'
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Text
          type='body'
          style={message.isOutgoing ? styles.textOutgoing : styles.textIncoming}
        >
          {message.body}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  rowIncoming: {
    alignItems: 'flex-start',
  },
  rowOutgoing: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderCurve: 'continuous',
    borderRadius: 16,
    maxWidth: '85%',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleIncoming: {
    backgroundColor: theme.color.surfaceElevated.dark,
  },
  bubbleOutgoing: {
    backgroundColor: theme.color.accent.dark,
  },
  textIncoming: {
    color: theme.color.text.dark,
  },
  textOutgoing: {
    color: theme.color.onAccent.dark,
  },
});
