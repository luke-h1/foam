import { Button as PressableButton } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/CosmeticUsername';
import { Text } from '@app/components/ui/Text/Text';
import type { InputRef } from '@app/components/ui/Input/Input';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { lightenColor } from '@app/utils/color/lightenColor';
import { truncate } from '@app/utils/string/truncate';
import {
  Button as SwiftUIButton,
  GlassEffectContainer,
  Host,
  Image,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  background,
  buttonStyle,
  clipShape,
  disabled as disabledModifier,
  padding,
  tint,
  type ViewModifier,
} from '@expo/ui/swift-ui/modifiers';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';
import { memo, RefObject, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { KeyboardController } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import type { SFSymbol } from 'sf-symbols-typescript';
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

interface ActionIconButtonProps {
  active?: boolean;
  disabled?: boolean;
  icon: SFSymbol;
  label?: string;
  onPress: () => void;
  prominent?: boolean;
}

function ActionIconButtonComponent({
  active,
  disabled,
  icon,
  label,
  onPress,
  prominent,
}: ActionIconButtonProps) {
  const liquidGlassAvailable = isLiquidGlassAvailable();
  const isHighlighted = Boolean(active || prominent);
  const resolvedButtonStyle = liquidGlassAvailable
    ? prominent
      ? 'glassProminent'
      : 'glass'
    : prominent
      ? 'bordered'
      : 'plain';
  const iconColor = disabled
    ? 'rgba(255,255,255,0.36)'
    : isHighlighted
      ? '#ffffff'
      : 'rgba(255,255,255,0.86)';
  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };
  const buttonModifiers: ViewModifier[] = [
    tint(iconColor),
    buttonStyle(resolvedButtonStyle),
    background(
      prominent
        ? theme.colorViolet
        : liquidGlassAvailable
          ? 'transparent'
          : active
            ? 'rgba(255,255,255,0.18)'
            : 'rgba(255,255,255,0.12)',
    ),
    clipShape('circle'),
    disabledModifier(Boolean(disabled)),
  ];

  if (label) {
    buttonModifiers.push(accessibilityLabel(label));
  }

  return (
    <Host matchContents style={styles.actionButtonHost}>
      <GlassEffectContainer>
        <SwiftUIButton onPress={handlePress} modifiers={buttonModifiers}>
          <Image
            color={iconColor}
            modifiers={[
              padding({ vertical: 6, horizontal: 0 }),
              clipShape('circle'),
              padding({
                horizontal: liquidGlassAvailable ? 0 : 12,
                vertical: liquidGlassAvailable ? 0 : 8,
              }),
            ]}
            size={18}
            systemName={icon}
          />
        </SwiftUIButton>
      </GlassEffectContainer>
    </Host>
  );
}

const ActionIconButton = memo(ActionIconButtonComponent);

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

    const canSend =
      messageInput.trim().length > 0 &&
      isConnected &&
      isAuthenticated &&
      !isSending;
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
      <View
        style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
      >
        {replyTo ? (
          <View style={styles.replyShell}>
            <BlurView
              intensity={32}
              style={StyleSheet.absoluteFill}
              tint='dark'
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
            <PressableButton
              onPress={onClearReply}
              style={styles.replyDismissButton}
            >
              <SymbolView tintColor='#ffffff' name='xmark' size={16} />
            </PressableButton>
          </View>
        ) : null}

        <GestureDetector gesture={composerGesture}>
          <Animated.View style={[styles.composerShell, composerAnimatedStyle]}>
            <View style={styles.inputRow}>
              <ActionIconButton
                icon='face.smiling'
                label='Open emote picker'
                onPress={onOpenEmoteSheet}
              />

              <View style={styles.inputContainer}>
                <ChatComposer
                  ref={inputRef}
                  autoCapitalize='none'
                  autoComplete='off'
                  autoCorrect={false}
                  blurOnSubmit
                  color='white'
                  editable={isAuthenticated}
                  onChangeText={onChangeText}
                  onEmoteSelect={handleEmoteSelect}
                  onSubmitEditing={onSubmit}
                  placeholder={inputPlaceholder}
                  placeholderTextColor='rgba(255,255,255,0.46)'
                  prioritizeChannelEmotes
                  radius='xl'
                  returnKeyType='send'
                  submitBehavior='blurAndSubmit'
                  style={styles.nativeInput}
                  value={messageInput}
                  variant='soft'
                />
              </View>

              <ActionIconButton
                icon='gearshape'
                label='Open chat settings'
                onPress={onOpenSettingsSheet}
              />
              {canPinNextMessage ? (
                <ActionIconButton
                  active={pinNextMessage}
                  icon={pinNextMessage ? 'pin.fill' : 'pin'}
                  label={
                    pinNextMessage ? 'Send and pin message' : 'Pin next message'
                  }
                  onPress={onTogglePinNextMessage ?? (() => undefined)}
                />
              ) : null}
              <ActionIconButton
                disabled={!canSend}
                icon='arrow.up'
                label='Send message'
                onPress={onSubmit}
                prominent={canSend}
              />
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

ChatInputSection.displayName = 'ChatInputSection';

const styles = StyleSheet.create({
  actionButtonHost: {
    flexShrink: 0,
    height: 48,
    width: 48,
  },
  composerShell: {
    overflow: 'visible',
    paddingHorizontal: theme.space16,
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
  },
  nativeInput: {
    backgroundColor: theme.darkActiveContent,
    borderRadius: 20,
    borderWidth: 0,
    maxHeight: 120,
    minHeight: 48,
    paddingBottom: 12,
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 0,
    paddingTop: 4,
    width: '100%',
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
