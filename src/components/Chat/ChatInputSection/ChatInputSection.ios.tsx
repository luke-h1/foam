import { Button as PressableButton } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/ChatMessage/CosmeticUsername/CosmeticUsername';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { lightenColor } from '@app/utils/color/lightenColor';
import { truncate } from '@app/utils/string/truncate';

import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  COMPOSER_CONTROL_SIZE,
  COMPOSER_ROW_GAP,
} from '../constants/composerSizing';
import { ChatComposer } from '../ChatComposer/ChatComposer';
import { useComposerDismissGesture } from '../hooks/useComposerDismissGesture';
import { ActionIconButton } from '../ActionIconButton/ActionIconButton';
import { ChatInputSectionProps } from './ChatInputSection';

export const ChatInputSection = memo(
  ({
    commandFeedback,
    connection,
    messageInput,
    onChangeText,
    onEmoteSelect,
    onSubmit,
    onOpenEmoteSheet,
    onOpenSettingsSheet,
    replyTo,
    onClearReply,
    pin,
    inputRef,
  }: ChatInputSectionProps) => {
    const { isAuthenticated, isConnected, isSending } = connection;
    const { canPinNextMessage, onTogglePinNextMessage, pinNextMessage } =
      pin ?? {};

    const { composerAnimatedStyle, composerGesture } =
      useComposerDismissGesture();

    const handleEmoteSelect = (emote: SanitisedEmote) => {
      onEmoteSelect(emote);
    };

    const hasCommandError = commandFeedback?.status === 'error';
    const canSend =
      messageInput.trim().length > 0 &&
      isConnected &&
      isAuthenticated &&
      !isSending &&
      !hasCommandError;
    let inputPlaceholder = 'Send a message...';
    if (replyTo !== null) {
      inputPlaceholder = `Reply to ${replyTo.username}...`;
    }
    if (!isAuthenticated) {
      inputPlaceholder = 'Sign in to send messages';
    }

    return (
      <View style={styles.wrapper}>
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
              <View style={styles.inputContainer}>
                <ChatComposer
                  ref={inputRef}
                  commandFeedback={commandFeedback}
                  onChangeText={onChangeText}
                  onSubmit={onSubmit}
                  onPressAdd={onOpenEmoteSheet}
                  onEmoteSelect={handleEmoteSelect}
                  placeholder={inputPlaceholder}
                  editable={isAuthenticated}
                  canSend={canSend}
                  prioritizeChannelEmotes
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
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  actionButtonHost: {
    flexShrink: 0,
    height: COMPOSER_CONTROL_SIZE,
    width: COMPOSER_CONTROL_SIZE,
  },
  composerShell: {
    backgroundColor: '#000000',
    overflow: 'visible',
    paddingHorizontal: theme.space12,
    paddingTop: theme.space4,
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: COMPOSER_ROW_GAP,
    paddingHorizontal: 0,
    paddingTop: 0,
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
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.18)',
  },
  wrapper: {
    gap: theme.space8,
  },
});
