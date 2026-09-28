import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@app/styles/themes';

import { useComposerDismissGesture } from '../hooks/use-composer-dismiss-gesture';
import type { ChatInputSectionProps } from '../util/chat-input-section-types';
import { COMPOSER_ROW_GAP } from '../util/composer-sizing';
import { isRefreshCommand } from '../util/slash-command-definitions/is-refresh-command';
import { ChatComposer } from './chat-composer/chat-composer';
import { GlassReplyPreview } from './glass-reply-preview';

export type { ReplyToData } from '../util/chat-input-section-types';

export const ChatInputSection = memo(
  ({
    connection,
    messageInput,
    onChangeText,
    onSubmit,
    onOpenEmoteSheet,
    onOpenSettingsSheet,
    onAttachImage,
    isUploadingImage,
    replyTo,
    onClearReply,
    inputRef,
  }: ChatInputSectionProps) => {
    const { isAuthenticated, isSending } = connection;

    const { composerAnimatedStyle, composerGesture } =
      useComposerDismissGesture();

    const insets = useSafeAreaInsets();

    const trimmedInput = messageInput.trim();

    // /refresh is purely client-side, so it works signed out
    const isRefresh = isRefreshCommand(messageInput);

    const canSend =
      trimmedInput.length > 0 && (isAuthenticated || isRefresh) && !isSending;

    const inputPlaceholder = !isAuthenticated
      ? 'Sign in to send messages'
      : replyTo !== null
        ? `Reply to ${replyTo.username}...`
        : 'Send a message...';

    return (
      <View style={styles.wrapper} testID='chat-input-bar'>
        {replyTo ? (
          <GlassReplyPreview onClearReply={onClearReply} replyTo={replyTo} />
        ) : null}

        <GestureDetector gesture={composerGesture}>
          <Animated.View
            style={[
              styles.composerShell,
              // The composer sits at the very bottom of the screen; clear the
              // home indicator. Chat.tsx cancels this while the keyboard
              // covers that area.
              { paddingBottom: insets.bottom },
              composerAnimatedStyle,
            ]}
          >
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <ChatComposer
                  ref={inputRef}
                  onChangeText={onChangeText}
                  onSubmit={onSubmit}
                  onPressAdd={onOpenEmoteSheet}
                  onAttachImage={isAuthenticated ? onAttachImage : undefined}
                  onOpenSettings={onOpenSettingsSheet}
                  isUploadingImage={isUploadingImage}
                  placeholder={inputPlaceholder}
                  editable
                  canSend={canSend}
                  // The send path prepends `@user ` for a reply.
                  reservedCharacters={replyTo ? replyTo.username.length + 2 : 0}
                  prioritizeChannelEmotes
                />
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  composerShell: {
    backgroundColor: theme.colorBlack,
    overflow: 'visible',
    paddingHorizontal: theme.space12,
    paddingTop: theme.space4,
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: COMPOSER_ROW_GAP,
    paddingHorizontal: 0,
    paddingTop: 0,
    width: '100%',
  },
  wrapper: {
    gap: theme.space8,
  },
});
