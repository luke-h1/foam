import { memo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { Button } from '@app/components/Button/Button';
import { PaintedUsername } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/PaintedUsername';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { lightenColor } from '@app/utils/color/lightenColor';
import {
  createHitslop,
  createHorizontalHitslop,
} from '@app/utils/string/createHitSlop';
import { truncate } from '@app/utils/string/truncate';

import { chatEntranceSpring } from '../util/chatEntranceSpring';
import { isRefreshCommand } from '../util/slashCommandDefinitions/isRefreshCommand';
import { ChatComposer } from './ChatComposer/ChatComposer';
import type {
  ChatInputSectionProps,
  ReplyToData,
} from './chatInputSectionTypes';
import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_CONTROL_SIZE,
  COMPOSER_ROW_GAP,
} from './composerSizing';
import { ReplyPreviewBody } from './ReplyPreviewBody';
import { useComposerDismissGesture } from './useComposerDismissGesture';

export type { ReplyToData };

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
    const { composerAnimatedStyle, composerGesture } =
      useComposerDismissGesture();

    const trimmedInput = messageInput.trim();
    // /refresh is purely client-side, so it works signed out
    const isRefresh = isRefreshCommand(messageInput);

    const canSend = Boolean(
      trimmedInput && (isAuthenticated || isRefresh) && !isSending,
    );

    const { t } = useTranslation('chat');
    const inputPlaceholder = !isAuthenticated
      ? t('composer.signInToSend')
      : replyTo !== null
        ? t('composer.replyToUser', { username: replyTo.username })
        : t('composer.sendAMessage');

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
                <Text style={styles.replyLabel}>
                  {t('composer.replyingTo')}{' '}
                </Text>
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
              {replyTo.messageParts?.length ? (
                <ReplyPreviewBody
                  parts={replyTo.messageParts}
                  textStyle={styles.replyMessagePreview}
                />
              ) : replyTo.message ? (
                <Text style={styles.replyMessagePreview} numberOfLines={1}>
                  {truncate(replyTo.message.trim() || replyTo.message, 60)}
                </Text>
              ) : null}
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
          <Animated.View style={[styles.composerShell, composerAnimatedStyle]}>
            <View style={styles.swipeHandle} />
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
                <Button
                  label={t('composer.attachImage')}
                  style={styles.actionButton}
                  onPress={onAttachImage}
                  disabled={isUploadingImage || !isAuthenticated}
                  hitSlop={createHorizontalHitslop(COMPOSER_CONTROL_SIZE)}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator
                      size='small'
                      color={theme.colorGreyHoverAlpha}
                    />
                  ) : (
                    <SymbolView
                      name='photo'
                      size={20}
                      tintColor={theme.colorGreyHoverAlpha}
                    />
                  )}
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
  composerShell: {
    backgroundColor: theme.color.surfaceElevated.dark,
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
