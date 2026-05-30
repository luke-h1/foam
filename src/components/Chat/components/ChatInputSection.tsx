import { Button } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/CosmeticUsername';
import { SymbolView } from 'expo-symbols';
import { Text } from '@app/components/ui/Text/Text';
import type { InputRef } from '@app/components/ui/Input/Input';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { lightenColor } from '@app/utils/color/lightenColor';
import {
  createHitslop,
  createHorizontalHitslop,
} from '@app/utils/string/createHitSlop';
import { truncate } from '@app/utils/string/truncate';
import { memo, RefObject, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { ChatComposer } from './ChatComposer/ChatComposer';

const COMPOSER_DISMISS_DRAG_DISTANCE = 34;
const COMPOSER_DISMISS_VELOCITY = 520;
const COMPOSER_DRAG_LIMIT = 64;

export interface ReplyToData {
  messageId: string;
  username: string;
  message: string;
  replyParentUserLogin: string;
  parentMessage: string;
  color?: string;
  /**
   * Twitch user-id for 7TV paint lookup in the reply preview
   */
  userId?: string;
}

interface ChatInputSectionProps {
  canPinNextMessage?: boolean;
  isSending?: boolean;
  messageInput: string;
  onChangeText: (text: string) => void;
  onEmoteSelect: (emote: SanitisedEmote) => void;
  onSubmit: () => void;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  replyTo: ReplyToData | null;
  onClearReply: () => void;
  onTogglePinNextMessage?: () => void;
  pinNextMessage?: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  inputRef?: RefObject<InputRef | null>;
}

export const ChatInputSection = memo(
  ({
    canPinNextMessage,
    isSending,
    messageInput,
    onChangeText,
    onEmoteSelect,
    onSubmit,
    onOpenEmoteSheet,
    onOpenSettingsSheet,
    replyTo,
    onClearReply,
    onTogglePinNextMessage,
    pinNextMessage,
    isConnected,
    isAuthenticated,
    inputRef,
  }: ChatInputSectionProps) => {
    const insets = useSafeAreaInsets();
    const composerDragOffset = useSharedValue(0);

    const handleEmoteSelect = useCallback(
      (emote: SanitisedEmote) => {
        onEmoteSelect(emote);
      },
      [onEmoteSelect],
    );

    const canSend = Boolean(
      messageInput.trim() && isConnected && isAuthenticated && !isSending,
    );

    const inputPlaceholder = !isAuthenticated
      ? 'Sign in to send messages'
      : replyTo !== null
        ? `Reply to ${replyTo.username}...`
        : 'Send a message...';

    const composerAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: composerDragOffset.value }],
    }));

    const dismissComposer = useCallback(() => {
      void KeyboardController.dismiss();
    }, []);

    const composerPanGesture = useMemo(
      () =>
        Gesture.Pan()
          .activeOffsetY(4)
          .failOffsetX([-40, 40])
          .onUpdate(event => {
            composerDragOffset.value = Math.max(
              0,
              Math.min(event.translationY, COMPOSER_DRAG_LIMIT),
            );
          })
          .onEnd(event => {
            const shouldDismiss =
              event.translationY > COMPOSER_DISMISS_DRAG_DISTANCE ||
              event.velocityY > COMPOSER_DISMISS_VELOCITY;

            if (shouldDismiss) {
              scheduleOnRN(dismissComposer);
            }
          })
          .onFinalize(() => {
            composerDragOffset.value = withSpring(0, {
              damping: 18,
              stiffness: 220,
            });
          }),
      [composerDragOffset, dismissComposer],
    );

    const composerFlingGesture = useMemo(
      () =>
        Gesture.Fling()
          .direction(Directions.DOWN)
          .onEnd(() => {
            scheduleOnRN(dismissComposer);
          }),
      [dismissComposer],
    );

    const composerGesture = useMemo(
      () => Gesture.Simultaneous(composerPanGesture, composerFlingGesture),
      [composerFlingGesture, composerPanGesture],
    );

    return (
      <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
        {replyTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyIndicator} />
            <View style={styles.replyContent}>
              <View style={styles.replyLabelRow}>
                <Text style={styles.replyLabel}>Replying to </Text>
                <PaintedUsername
                  username={replyTo.username}
                  userId={replyTo.userId}
                  showColon={false}
                  usernameTextStyle={styles.replyPaintedUsername}
                  fallbackColor={
                    replyTo.color ? lightenColor(replyTo.color) : undefined
                  }
                />
              </View>
              {replyTo.message && (
                <Text style={styles.replyMessagePreview} numberOfLines={1}>
                  {truncate(replyTo.message.trim() || replyTo.message, 60)}
                </Text>
              )}
            </View>
            <Button
              style={styles.replyDismissButton}
              onPress={onClearReply}
              hitSlop={createHitslop(20)}
            >
              <SymbolView
                name="xmark"
                size={18}
                tintColor={theme.colorGreyHoverAlpha}
              />
            </Button>
          </View>
        )}

        <GestureDetector gesture={composerGesture}>
          <Animated.View style={[styles.composerShell, composerAnimatedStyle]}>
            <View style={styles.swipeHandle} />
            <View style={styles.inputRow}>
              <Button
                style={styles.actionButton}
                onPress={onOpenEmoteSheet}
                hitSlop={createHorizontalHitslop(44)}
              >
                <SymbolView
                  name="face.smiling"
                  size={22}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              </Button>

              <View style={styles.inputContainer}>
                <ChatComposer
                  ref={inputRef}
                  value={messageInput}
                  onChangeText={onChangeText}
                  onEmoteSelect={handleEmoteSelect}
                  placeholder={inputPlaceholder}
                  editable={isAuthenticated}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect={false}
                  blurOnSubmit
                  placeholderTextColor="#8E8E93"
                  onSubmitEditing={onSubmit}
                  returnKeyType="send"
                  submitBehavior="blurAndSubmit"
                  prioritizeChannelEmotes
                />
              </View>

              {canPinNextMessage ? (
                <Button
                  label={
                    pinNextMessage ? 'Send and pin message' : 'Pin next message'
                  }
                  style={[
                    styles.actionButton,
                    pinNextMessage && styles.actionButtonActive,
                  ]}
                  onPress={onTogglePinNextMessage}
                  hitSlop={createHorizontalHitslop(44)}
                >
                  <SymbolView
                    name="mappin"
                    size={20}
                    tintColor={
                      pinNextMessage ? '#fff' : theme.colorGreyHoverAlpha
                    }
                  />
                </Button>
              ) : null}

              <Button
                style={styles.actionButton}
                onPress={onOpenSettingsSheet}
                hitSlop={createHorizontalHitslop(44)}
              >
                <SymbolView
                  name="gearshape"
                  size={22}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              </Button>

              <Button
                style={[
                  styles.sendButton,
                  !canSend && styles.sendButtonDisabled,
                ]}
                onPress={onSubmit}
                disabled={!canSend}
                hitSlop={createHitslop(20)}
              >
                <SymbolView
                  name="arrow.up"
                  size={20}
                  tintColor={canSend ? '#fff' : theme.colorGreyHoverAlpha}
                />
              </Button>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

ChatInputSection.displayName = 'ChatInputSection';

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  composerShell: {
    paddingHorizontal: theme.space16,
  },
  inputContainer: {
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    minWidth: 0,
    overflow: 'hidden',
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.space8,
    paddingBottom: theme.space8,
    paddingTop: 4,
  },
  replyContent: {
    flex: 1,
  },
  replyDismissButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginLeft: 'auto',
    width: 36,
  },
  replyIndicator: {
    backgroundColor: theme.colorViolet,
    borderRadius: 2,
    height: '100%',
    marginRight: theme.space12,
    minHeight: 32,
    width: 3,
  },
  replyLabel: {
    fontSize: theme.fontSize12,
    opacity: 0.7,
  },
  replyLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  replyMessagePreview: {
    fontSize: theme.fontSize14,
    marginTop: 2,
    opacity: 0.6,
  },
  replyPaintedUsername: {
    fontSize: theme.fontSize12,
    fontWeight: '600',
  },
  replyPreview: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: theme.colorViolet,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendButtonDisabled: {
    backgroundColor: theme.darkActiveContent,
    opacity: 0.6,
  },
  swipeHandle: {
    alignSelf: 'center',
    backgroundColor: theme.colorGreyHoverAlpha,
    borderRadius: 999,
    height: 4,
    marginBottom: 2,
    opacity: 0.5,
    width: 34,
  },
  wrapper: {
    backgroundColor: 'transparent',
    gap: theme.space8,
  },
});
