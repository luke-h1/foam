import { Button } from '@app/components/Button/Button';
import { SymbolView } from 'expo-symbols';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { lightenColor } from '@app/utils/color/lightenColor';
import {
  createHitslop,
  createHorizontalHitslop,
} from '@app/utils/string/createHitSlop';
import { truncate } from '@app/utils/string/truncate';
import { memo, RefObject } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatComposer, ChatComposerHandle } from '../ChatComposer/ChatComposer';
import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_CONTROL_SIZE,
  COMPOSER_ROW_GAP,
} from '../constants/composerSizing';
import { PaintedUsername } from '../ChatMessage/CosmeticUsername/CosmeticUsername';
import { useComposerDismissGesture } from '../hooks/useComposerDismissGesture';
import { ChatConnectionFlags, ChatPinFlags } from '../types/chatUiFlags';
import type { ChatCommandFeedback } from '../util/chatCommands';

export interface ReplyToData {
  messageId: string;
  username: string;
  message: string;
  replyParentUserLogin: string;
  parentMessage: string;
  color?: string;
  /**
   * Twitch user-id for 7TV paint lookup in reply previews
   */
  userId?: string;
}

export interface ChatInputSectionProps {
  commandFeedback?: ChatCommandFeedback | null;
  connection: ChatConnectionFlags;
  messageInput: string;
  onChangeText: (text: string) => void;
  onEmoteSelect: (emote: SanitisedEmote) => void;
  onSubmit: () => void;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  replyTo: ReplyToData | null;
  onClearReply: () => void;
  pin?: ChatPinFlags;
  inputRef?: RefObject<ChatComposerHandle | null>;
}

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
    const insets = useSafeAreaInsets();
    const { composerAnimatedStyle, composerGesture } =
      useComposerDismissGesture();

    const handleEmoteSelect = (emote: SanitisedEmote) => {
      onEmoteSelect(emote);
    };

    const hasCommandError = commandFeedback?.status === 'error';
    const canSend = Boolean(
      messageInput.trim() &&
      isConnected &&
      isAuthenticated &&
      !isSending &&
      !hasCommandError,
    );

    let inputPlaceholder = 'Send a message...';
    if (replyTo !== null) {
      inputPlaceholder = `Reply to ${replyTo.username}...`;
    }
    if (!isAuthenticated) {
      inputPlaceholder = 'Sign in to send messages';
    }

    return (
      <View style={styles.wrapper}>
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
              {!!replyTo.message && (
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
                name='xmark'
                size={18}
                tintColor={theme.colorGreyHoverAlpha}
              />
            </Button>
          </View>
        )}

        <GestureDetector gesture={composerGesture}>
          <Animated.View
            style={[
              styles.composerShell,
              { paddingBottom: insets.bottom + theme.space8 },
              composerAnimatedStyle,
            ]}
          >
            <View style={styles.swipeHandle} />
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
                  hitSlop={createHorizontalHitslop(COMPOSER_CONTROL_SIZE)}
                >
                  <SymbolView
                    name='mappin'
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
                hitSlop={createHorizontalHitslop(COMPOSER_CONTROL_SIZE)}
              >
                <SymbolView
                  name='gearshape'
                  size={22}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              </Button>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderRadius: COMPOSER_CONTROL_RADIUS,
    borderWidth: 1,
    height: COMPOSER_CONTROL_SIZE,
    justifyContent: 'center',
    width: COMPOSER_CONTROL_SIZE,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  composerShell: {
    backgroundColor: '#222222',
    paddingHorizontal: theme.space16,
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: COMPOSER_ROW_GAP,
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
