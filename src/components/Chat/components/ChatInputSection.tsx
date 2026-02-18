import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/Text/Text';
import type { SanitisedEmote } from '@app/types/emote';
import { lightenColor } from '@app/utils/color/lightenColor';
import {
  createHitslop,
  createHorizontalHitslop,
} from '@app/utils/string/createHitSlop';
import { truncate } from '@app/utils/string/truncate';
import { memo, RefObject, useCallback, useRef } from 'react';
import { View, TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { ChatComposer } from './ChatComposer/ChatComposer';

export interface ReplyToData {
  messageId: string;
  username: string;
  message: string;
  replyParentUserLogin: string;
  parentMessage: string;
  color?: string;
}

interface ChatInputSectionProps {
  messageInput: string;
  onChangeText: (text: string) => void;
  onEmoteSelect: (emote: SanitisedEmote) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmit: () => void;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  onOpenDebugModal: () => void;
  replyTo: ReplyToData | null;
  onClearReply: () => void;
  isConnected: boolean;
  inputRef?: RefObject<TextInput | null>;
}

export const ChatInputSection = memo(
  ({
    messageInput,
    onChangeText,
    onEmoteSelect,
    onFocus,
    onBlur,
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
    const containerRef = useRef<View>(null);

    const handleEmoteSelect = useCallback(
      (emote: SanitisedEmote) => {
        onEmoteSelect(emote);
      },
      [onEmoteSelect],
    );

    const canSend = messageInput.trim() && isConnected;

    const inputPlaceholder =
      replyTo !== null
        ? `Reply to ${replyTo.username}...`
        : 'Send a message...';

    return (
      <View
        ref={containerRef}
        style={[styles.wrapper, { paddingBottom: insets.bottom }]}
      >
        {replyTo && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={styles.replyPreview}
          >
            <View style={styles.replyIndicator} />
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>
                Replying to{' '}
                <Text
                  style={[
                    styles.replyUsername,
                    replyTo.color && { color: lightenColor(replyTo.color) },
                  ]}
                >
                  {replyTo.username}
                </Text>
              </Text>
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
              <Icon icon="x" size={18} />
            </Button>
          </Animated.View>
        )}

        <View style={styles.inputRow}>
          <Button
            style={styles.actionButton}
            onPress={onOpenEmoteSheet}
            hitSlop={createHorizontalHitslop(44)}
          >
            <Icon icon="smile" size={22} />
          </Button>

          <View style={styles.inputContainer}>
            <ChatComposer
              ref={inputRef}
              value={messageInput}
              onChangeText={onChangeText}
              onEmoteSelect={handleEmoteSelect}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={inputPlaceholder}
              editable
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#8E8E93"
              onSubmitEditing={onSubmit}
              returnKeyType="send"
              prioritizeChannelEmotes
            />
          </View>

          <Button
            style={styles.actionButton}
            onPress={onOpenSettingsSheet}
            hitSlop={createHorizontalHitslop(44)}
          >
            <Icon icon="settings" size={22} />
          </Button>

          <Button
            style={styles.actionButton}
            onPress={onOpenDebugModal}
            hitSlop={createHitslop(20)}
          >
            <Icon icon="zap" size={20} />
          </Button>

          <Button
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={onSubmit}
            disabled={!canSend}
            hitSlop={createHitslop(20)}
          >
            <Icon
              icon="arrow-up"
              size={20}
              color={canSend ? '#fff' : undefined}
            />
          </Button>
        </View>
      </View>
    );
  },
);

ChatInputSection.displayName = 'ChatInputSection';

const styles = StyleSheet.create(theme => ({
  wrapper: {
    backgroundColor: theme.colors.black.bgAlpha,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: 6,
  },
  inputContainer: {
    flex: 1,
    minWidth: 80,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.violet.accent,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.gray.ui,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.accent.ui,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.border,
  },
  replyIndicator: {
    width: 3,
    height: '100%',
    minHeight: 32,
    backgroundColor: theme.colors.violet.accent,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: theme.font.fontSize.xs,
    opacity: 0.7,
  },
  replyUsername: {
    fontWeight: '600',
    opacity: 1,
  },
  replyMessagePreview: {
    fontSize: theme.font.fontSize.sm,
    opacity: 0.6,
    marginTop: 2,
  },
  replyDismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
}));
