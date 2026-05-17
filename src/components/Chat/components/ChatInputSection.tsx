import { Button } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/CosmeticUsername';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { lightenColor } from '@app/utils/color/lightenColor';
import {
  createHitslop,
  createHorizontalHitslop,
} from '@app/utils/string/createHitSlop';
import { truncate } from '@app/utils/string/truncate';
import { memo, RefObject, useCallback, useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatComposer } from './ChatComposer/ChatComposer';

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
  messageInput: string;
  onChangeText: (text: string) => void;
  onEmoteSelect: (emote: SanitisedEmote) => void;
  onSubmit: () => void;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  replyTo: ReplyToData | null;
  onClearReply: () => void;
  isConnected: boolean;
  isAuthenticated: boolean;
  inputRef?: RefObject<TextInput | null>;
}

export const ChatInputSection = memo(
  ({
    messageInput,
    onChangeText,
    onEmoteSelect,
    onSubmit,
    onOpenEmoteSheet,
    onOpenSettingsSheet,
    replyTo,
    onClearReply,
    isConnected,
    isAuthenticated,
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

    const canSend = Boolean(
      messageInput.trim() && isConnected && isAuthenticated,
    );

    const inputPlaceholder = !isAuthenticated
      ? 'Sign in to send messages'
      : replyTo !== null
        ? `Reply to ${replyTo.username}...`
        : 'Send a message...';

    return (
      <View
        ref={containerRef}
        style={[styles.wrapper, { paddingBottom: insets.bottom }]}
      >
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
              <Icon icon="x" size={18} />
            </Button>
          </View>
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
              placeholder={inputPlaceholder}
              editable={isAuthenticated}
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

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  inputContainer: {
    flex: 1,
    minWidth: 80,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space4,
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    backgroundColor: 'transparent',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
    opacity: 0.6,
  },
  wrapper: {
    backgroundColor: '#2b2b2b',
    borderTopColor: '#454545',
    borderTopWidth: 1,
  },
});
