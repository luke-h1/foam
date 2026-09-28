import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@app/components/button/button';
import { PaintedUsername } from '@app/components/chat/components/chat-message/cosmetic-username/painted-username';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import { lightenColor } from '@app/utils/color/lighten-color';
import { createHitslop } from '@app/utils/string/create-hit-slop';
import { truncate } from '@app/utils/string/truncate';

import { useComposerDismissGesture } from '../hooks/use-composer-dismiss-gesture';
import { chatEntranceSpring } from '../util/chat-entrance-spring';
import type {
  ChatInputSectionProps,
  ReplyToData,
} from '../util/chat-input-section-types';
import { COMPOSER_ROW_GAP } from '../util/composer-sizing';
import { isRefreshCommand } from '../util/slash-command-definitions/is-refresh-command';
import { ChatComposer } from './chat-composer/chat-composer';
import { ReplyPreviewBody } from './reply-preview-body';

export type { ReplyToData };

const replyPreviewEntering = chatEntranceSpring(FadeInUp);
const replyPreviewExiting = FadeOutDown.duration(140);

function ReplyPreviewMessage({ replyTo }: { replyTo: ReplyToData }) {
  if (replyTo.messageParts?.length) {
    return (
      <ReplyPreviewBody
        tokens={replyTo.messageParts}
        textStyle={styles.replyMessagePreview}
      />
    );
  }

  if (replyTo.message) {
    return (
      <Text style={styles.replyMessagePreview} numberOfLines={1}>
        {truncate(replyTo.message.trim() || replyTo.message, 60)}
      </Text>
    );
  }

  return null;
}

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
    const insets = useSafeAreaInsets();

    const { composerAnimatedStyle, composerGesture } =
      useComposerDismissGesture();

    const trimmedInput = messageInput.trim();

    // /refresh is purely client-side, so it works signed out
    const isRefresh = isRefreshCommand(messageInput);

    const canSend = Boolean(
      trimmedInput && (isAuthenticated || isRefresh) && !isSending,
    );

    let inputPlaceholder = 'Send a message...';

    if (!isAuthenticated) {
      inputPlaceholder = 'Sign in to send messages';
    } else if (replyTo !== null) {
      inputPlaceholder = `Reply to ${replyTo.username}...`;
    }

    return (
      <View style={styles.wrapper} testID='chat-input-bar'>
        {replyTo && (
          <Animated.View
            entering={replyPreviewEntering}
            exiting={replyPreviewExiting}
            style={styles.replyPreview}
          >
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
              <ReplyPreviewMessage replyTo={replyTo} />
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
          </Animated.View>
        )}

        <GestureDetector gesture={composerGesture}>
          <Animated.View
            style={[
              styles.composerShell,
              // The composer sits at the very bottom of the screen; clear the
              // home indicator. Chat.tsx cancels this lift while the keyboard
              // covers that area.
              { paddingBottom: insets.bottom + theme.space8 },
              composerAnimatedStyle,
            ]}
          >
            <View style={styles.swipeHandle} />
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
    paddingBottom: theme.space8,
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
    borderCurve: 'continuous',
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
