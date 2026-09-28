import { StyleSheet, View, type ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import {
  GestureDetector,
  type GestureType,
} from 'react-native-gesture-handler';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { ChannelPollCard } from '@app/components/channel-poll-card/channel-poll-card';
import { ChannelPredictionCard } from '@app/components/channel-prediction-card/channel-prediction-card';
import { Chat } from '@app/components/chat/chat';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

import type { FullscreenChatMode } from '../types';
import { ChatLatencyPill } from './chat-latency-pill';

/**
 * The chat half of the screen: the chat itself once the channel resolves, the
 * notice shown while it waits for the stream, and the landscape resize handle.
 */
export function LiveStreamChatPane({
  animatedResizeHandleStyle,
  animatedStyle,
  containerStyle,
  customPlayerEnabled,
  fullscreenChatMode,
  isLandscape,
  isStreamEnabled,
  poll,
  prediction,
  resizeChatGesture,
  resolvedChannelId,
  resolvedChannelLogin,
  shouldMountChat,
  shouldShowChatConnectionNotice,
}: {
  animatedResizeHandleStyle: AnimatedStyle<ViewStyle>;
  animatedStyle: AnimatedStyle<ViewStyle>;
  containerStyle: StyleProp<ViewStyle>;
  customPlayerEnabled: boolean;
  fullscreenChatMode: FullscreenChatMode;
  isLandscape: boolean;
  isStreamEnabled: boolean;
  poll: React.ComponentProps<typeof ChannelPollCard>['poll'] | null;
  prediction:
    React.ComponentProps<typeof ChannelPredictionCard>['prediction'] | null;
  resizeChatGesture: GestureType;
  resolvedChannelId: string | undefined;
  resolvedChannelLogin: string;
  shouldMountChat: boolean;
  shouldShowChatConnectionNotice: boolean;
}) {
  return (
    <Animated.View
      style={[styles.chatContainer, animatedStyle, containerStyle]}
    >
      {shouldMountChat || shouldShowChatConnectionNotice ? (
        <View
          style={[
            styles.chatContent,
            isLandscape &&
              fullscreenChatMode === 'overlay' &&
              styles.overlayChatContent,
          ]}
        >
          {shouldMountChat &&
          isStreamEnabled &&
          isLandscape &&
          fullscreenChatMode === 'overlay' ? (
            isLiquidGlassAvailable() ? (
              <GlassView
                colorScheme='dark'
                glassEffectStyle='clear'
                style={styles.overlayChatBlur}
              />
            ) : (
              <BlurView
                intensity={36}
                style={styles.overlayChatBlur}
                tint='dark'
              />
            )
          ) : null}
          {isStreamEnabled && customPlayerEnabled ? <ChatLatencyPill /> : null}
          {isStreamEnabled && prediction && resolvedChannelLogin ? (
            <ChannelPredictionCard
              channelLogin={resolvedChannelLogin}
              prediction={prediction}
            />
          ) : null}
          {isStreamEnabled && poll && resolvedChannelLogin ? (
            <ChannelPollCard channelLogin={resolvedChannelLogin} poll={poll} />
          ) : null}
          {shouldMountChat ? (
            <Chat
              key={resolvedChannelId}
              applyTopInset={isLandscape && isStreamEnabled}
              channelId={resolvedChannelId!}
              channelName={resolvedChannelLogin}
              transparent={
                isStreamEnabled &&
                isLandscape &&
                fullscreenChatMode === 'overlay'
              }
            />
          ) : (
            <View style={styles.chatConnectionNotice}>
              <SymbolView
                tintColor={theme.colorGrey}
                name='message'
                size={24}
              />
              <Text
                align='center'
                color='gray.contrast'
                type='sm'
                weight='semibold'
              >
                Chat will connect when the stream starts.
              </Text>
              <Text align='center' color='gray' type='xs'>
                This can take up to 10 seconds so video playback stays first.
              </Text>
            </View>
          )}
        </View>
      ) : null}
      {isStreamEnabled &&
      isLandscape &&
      (shouldMountChat || shouldShowChatConnectionNotice) ? (
        <GestureDetector gesture={resizeChatGesture}>
          <Animated.View
            accessibilityLabel='Resize chat'
            accessibilityRole='adjustable'
            style={[styles.chatResizeHandle, animatedResizeHandleStyle]}
          >
            <View style={styles.chatResizeDividerLine} />
            <View style={styles.chatResizeGrip}>
              <View style={styles.chatResizeIndicator} />
            </View>
          </Animated.View>
        </GestureDetector>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chatConnectionNotice: {
    alignItems: 'center',
    flex: 1,
    gap: theme.space8,
    justifyContent: 'center',
    paddingHorizontal: theme.space24,
  },
  chatContainer: {
    backgroundColor: theme.colorBlack,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 1,
  },
  chatContent: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  chatResizeDividerLine: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
  },
  chatResizeGrip: {
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,22,0.74)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 52,
    justifyContent: 'center',
    width: 16,
  },
  chatResizeHandle: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 0,
    width: 30,
    zIndex: 8,
  },
  chatResizeIndicator: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: theme.borderRadius999,
    height: 26,
    width: 3,
  },
  overlayChatBlur: {
    ...StyleSheet.absoluteFill,
  },
  overlayChatContent: {
    backgroundColor: 'rgba(10, 11, 16, 0.42)',
    borderLeftColor: theme.colorBorderSecondary,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
});
