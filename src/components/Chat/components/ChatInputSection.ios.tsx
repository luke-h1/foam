import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';

import { Button as PressableButton } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/CosmeticUsername';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { lightenColor } from '@app/utils/color/lightenColor';
import { truncate } from '@app/utils/string/truncate';

import { ChatComposer } from './ChatComposer/ChatComposer';
import type { ChatInputSectionProps } from './chatInputSectionTypes';
import { ComposerIconButton } from './ComposerIconButton';
import { COMPOSER_ROW_GAP } from './composerSizing';
import { ReplyPreviewBody } from './ReplyPreviewBody';
import { useComposerDismissGesture } from './useComposerDismissGesture';

export type { ReplyToData } from './chatInputSectionTypes';

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

    const canSend =
      messageInput.trim().length > 0 && isAuthenticated && !isSending;
    const { t } = useTranslation('chat');
    const inputPlaceholder = !isAuthenticated
      ? t('composer.signInToSend')
      : replyTo !== null
        ? t('composer.replyToUser', { username: replyTo.username })
        : t('composer.sendAMessage');

    return (
      <View style={styles.wrapper} testID='chat-input-bar'>
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
                <Text style={styles.replyLabel}>
                  {t('composer.replyingTo')}
                </Text>
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
              {replyTo.messageParts?.length ? (
                <ReplyPreviewBody
                  parts={replyTo.messageParts}
                  textStyle={styles.replyMessagePreview}
                />
              ) : replyTo.message ? (
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
                  onChangeText={onChangeText}
                  onSubmit={onSubmit}
                  onPressAdd={onOpenEmoteSheet}
                  placeholder={inputPlaceholder}
                  editable={isAuthenticated}
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
