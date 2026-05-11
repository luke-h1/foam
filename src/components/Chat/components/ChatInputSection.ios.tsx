import { Button } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/CosmeticUsername';
import {
  IconSymbol,
  type IconSymbolName,
} from '@app/components/IconSymbol/IconSymbol';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { lightenColor } from '@app/utils/color/lightenColor';
import { truncate } from '@app/utils/string/truncate';
import { BlurView } from 'expo-blur';
import { memo, RefObject, useCallback, useMemo } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { ChatComposer } from './ChatComposer/ChatComposer';

export interface ReplyToData {
  messageId: string;
  username: string;
  message: string;
  replyParentUserLogin: string;
  parentMessage: string;
  color?: string;
  userId?: string;
}

interface ChatInputSectionProps {
  messageInput: string;
  onChangeText: (text: string) => void;
  onEmoteSelect: (emote: SanitisedEmote) => void;
  onSubmit: () => void;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  onOpenDebugModal: () => void;
  replyTo: ReplyToData | null;
  onClearReply: () => void;
  isConnected: boolean;
  inputRef?: RefObject<TextInput | null>;
}

interface ActionIconButtonProps {
  disabled?: boolean;
  icon: IconSymbolName;
  onPress: () => void;
}

function ActionIconButton({ disabled, icon, onPress }: ActionIconButtonProps) {
  return (
    <Button
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
    >
      <IconSymbol
        color={disabled ? 'rgba(255,255,255,0.36)' : '#ffffff'}
        name={icon}
        size={18}
        weight="medium"
      />
    </Button>
  );
}

export const ChatInputSection = memo(
  ({
    messageInput,
    onChangeText,
    onEmoteSelect,
    onSubmit,
    onOpenEmoteSheet,
    onOpenSettingsSheet,
    onOpenDebugModal,
    replyTo,
    onClearReply,
    isConnected,
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

    const canSend = messageInput.trim().length > 0 && isConnected;
    const inputPlaceholder =
      replyTo !== null
        ? `Reply to ${replyTo.username}...`
        : 'Send a message...';

    const composerAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: composerDragOffset.value }],
    }));

    const dismissKeyboard = useCallback(() => {
      Keyboard.dismiss();
    }, []);

    const composerPanGesture = useMemo(
      () =>
        Gesture.Pan()
          .activeOffsetY(8)
          .failOffsetX([-24, 24])
          .onChange(event => {
            composerDragOffset.value = Math.max(
              0,
              Math.min(event.translationY, 56),
            );
          })
          .onEnd(event => {
            const shouldDismiss =
              event.translationY > 44 || event.velocityY > 700;

            if (shouldDismiss) {
              scheduleOnRN(dismissKeyboard);
            }
          })
          .onFinalize(() => {
            composerDragOffset.value = withSpring(0, {
              damping: 18,
              stiffness: 220,
            });
          }),
      [composerDragOffset, dismissKeyboard],
    );

    return (
      <View
        style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
      >
        {replyTo ? (
          <View style={styles.replyShell}>
            <BlurView
              intensity={32}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
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
              {replyTo.message ? (
                <Text numberOfLines={1} style={styles.replyMessagePreview}>
                  {truncate(replyTo.message.trim() || replyTo.message, 72)}
                </Text>
              ) : null}
            </View>
            <Button onPress={onClearReply} style={styles.replyDismissButton}>
              <IconSymbol color="#ffffff" name="xmark" size={16} />
            </Button>
          </View>
        ) : null}

        <GestureDetector gesture={composerPanGesture}>
          <Animated.View style={[styles.composerShell, composerAnimatedStyle]}>
            <View style={styles.composerSurface}>
              <View style={styles.composerBar}>
                <View pointerEvents="none" style={styles.composerBarChrome}>
                  <BlurView
                    intensity={34}
                    style={StyleSheet.absoluteFill}
                    tint="dark"
                  />
                </View>

                <View style={styles.inputRow}>
                  <ActionIconButton
                    icon="face.smiling"
                    onPress={onOpenEmoteSheet}
                  />

                  <View style={styles.inputContainer}>
                    <View style={styles.inputGlass}>
                      <ChatComposer
                        ref={inputRef}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect={false}
                        editable
                        onChangeText={onChangeText}
                        onEmoteSelect={handleEmoteSelect}
                        onSubmitEditing={onSubmit}
                        placeholder={inputPlaceholder}
                        placeholderTextColor="rgba(255,255,255,0.46)"
                        prioritizeChannelEmotes
                        returnKeyType="send"
                        value={messageInput}
                      />
                    </View>
                  </View>

                  <ActionIconButton
                    icon="gearshape"
                    onPress={onOpenSettingsSheet}
                  />
                  <ActionIconButton
                    icon="bolt.fill"
                    onPress={onOpenDebugModal}
                  />
                  <ActionIconButton
                    disabled={!canSend}
                    icon="arrow.up"
                    onPress={onSubmit}
                  />
                </View>
              </View>
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
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  composerShell: {
    paddingHorizontal: theme.space12,
    overflow: 'visible',
  },
  composerSurface: {
    overflow: 'visible',
  },
  composerBar: {
    overflow: 'visible',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
  },
  composerBarChrome: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.58)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputContainer: {
    flex: 1,
    minWidth: 80,
  },
  inputGlass: {
    minHeight: 46,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 10,
  },
  replyContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  replyIndicator: {
    alignSelf: 'stretch',
    backgroundColor: theme.colorViolet,
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
  replyDismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
    minHeight: 28,
    minWidth: 28,
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
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    marginBottom: theme.space8,
    marginHorizontal: theme.space12,
    overflow: 'hidden',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  wrapper: {
    gap: theme.space8,
  },
});
