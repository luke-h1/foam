import { memo } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { BlurView } from 'expo-blur';

import { Button as PressableButton } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/PaintedUsername';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { cachedLighten } from '@app/utils/chat/resolveCachedSenderColor/cachedLighten';
import { truncate } from '@app/utils/string/truncate';

import { chatEntranceSpring } from '../util/chatEntranceSpring';
import { isRefreshCommand } from '../util/slashCommandDefinitions/isRefreshCommand';
import { ChatComposer } from './ChatComposer/ChatComposer';
import type { ChatInputSectionProps } from './chatInputSectionTypes';
import { ComposerIconButton } from './ComposerIconButton';
import { COMPOSER_CONTROL_RADIUS, COMPOSER_ROW_GAP } from './composerSizing';
import { ReplyPreviewBody } from './ReplyPreviewBody';
import { useComposerDismissGesture } from './useComposerDismissGesture';

export type { ReplyToData } from './chatInputSectionTypes';

const replyPreviewEntering = chatEntranceSpring(FadeInUp);
const replyPreviewExiting = FadeOutDown.duration(140);
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
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'light' ? 'light' : 'dark';
    const { composerAnimatedStyle, composerGesture } =
      useComposerDismissGesture();

    const trimmedInput = messageInput.trim();
    // /refresh is purely client-side, so it works signed out
    const isRefresh = isRefreshCommand(messageInput);

    const canSend =
      trimmedInput.length > 0 && (isAuthenticated || isRefresh) && !isSending;

    const { t } = useTranslation('chat');
    const inputPlaceholder = !isAuthenticated
      ? t('composer.signInToSend')
      : replyTo !== null
        ? t('composer.replyToUser', { username: replyTo.username })
        : t('composer.sendAMessage');

    return (
      <View style={styles.wrapper} testID='chat-input-bar'>
        {replyTo ? (
          <Animated.View
            entering={replyPreviewEntering}
            exiting={replyPreviewExiting}
            style={[
              styles.replyShell,
              {
                backgroundColor: theme.color.backgroundAltAlpha[scheme],
                borderColor: theme.color.border[scheme],
              },
            ]}
          >
            <BlurView
              intensity={32}
              style={StyleSheet.absoluteFill}
              tint={scheme}
            />
            <View
              style={[
                styles.replyIndicator,
                { backgroundColor: theme.color.violet[scheme] },
              ]}
            />
            <View style={styles.replyContent}>
              <View style={styles.replyLabelRow}>
                <Text
                  style={[
                    styles.replyLabel,
                    { color: theme.color.textSecondary[scheme] },
                  ]}
                >
                  {t('composer.replyingTo')}
                </Text>
                <PaintedUsername
                  fallbackColor={
                    replyTo.color ? cachedLighten(replyTo.color) : undefined
                  }
                  showColon={false}
                  userId={replyTo.userId}
                  username={replyTo.username}
                  usernameTextStyle={styles.replyPaintedUsername}
                />
              </View>
              {replyTo.messageParts?.length ? (
                <ReplyPreviewBody
                  parts={replyTo.messageParts}
                  textStyle={[
                    styles.replyMessagePreview,
                    { color: theme.color.text[scheme] },
                  ]}
                />
              ) : replyTo.message ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.replyMessagePreview,
                    { color: theme.color.text[scheme] },
                  ]}
                >
                  {truncate(replyTo.message.trim() || replyTo.message, 72)}
                </Text>
              ) : null}
            </View>
            <PressableButton
              onPress={onClearReply}
              style={styles.replyDismissButton}
            >
              <SymbolView
                tintColor={theme.color.text[scheme]}
                name='xmark'
                size={16}
              />
            </PressableButton>
          </Animated.View>
        ) : null}

        <GestureDetector gesture={composerGesture}>
          <Animated.View
            style={[
              styles.composerShell,
              { backgroundColor: theme.color.background[scheme] },
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
                  placeholder={inputPlaceholder}
                  editable
                  canSend={canSend}
                  prioritizeChannelEmotes
                />
              </View>

              {onAttachImage ? (
                <ComposerIconButton
                  disabled={isUploadingImage || !isAuthenticated}
                  icon={isUploadingImage ? 'arrow.up.circle' : 'photo'}
                  label={t('composer.attachImage')}
                  onPress={onAttachImage}
                />
              ) : null}
              <ComposerIconButton
                icon='gearshape'
                label={t('composer.openChatSettings')}
                onPress={onOpenSettingsSheet}
              />
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  composerShell: {
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
  replyContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  replyIndicator: {
    alignSelf: 'stretch',
    borderCurve: 'continuous',
    borderRadius: 999,
    width: 3,
  },
  replyLabel: {
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
    fontSize: theme.fontSize14,
  },
  replyPaintedUsername: {
    fontSize: theme.fontSize12,
    fontWeight: '700',
  },
  replyShell: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: COMPOSER_CONTROL_RADIUS,
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
