import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { COMPOSER_ROW_GAP } from '@app/components/chat/components/chat-composer/util/composerSizing';
import { theme } from '@app/styles/themes';

import { ChatComposer } from './chat-composer/ChatComposer';
import { ReplyPreview } from './chat-composer/components/ReplyPreview';
import { useChatInputSectionState } from './chat-composer/hooks/use-chat-input-section-state';
import type { ChatInputSectionProps } from './ChatInputSection.types';

const COMPOSER_PADDING = Platform.select({
  ios: { bottom: 0, horizontal: theme.space12 },
  default: { bottom: theme.space8, horizontal: theme.space16 },
});

export const ChatInputSection = memo(
  ({
    isAuthenticated,
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
    includeHorizontalSafeArea = true,
  }: ChatInputSectionProps) => {
    const {
      canSend,
      composerAnimatedStyle,
      composerGesture,
      inputPlaceholder,
      insets,
      reservedCharacters,
    } = useChatInputSectionState({ isAuthenticated, messageInput, replyTo });

    return (
      <View style={styles.wrapper} testID='chat-input-bar'>
        {replyTo ? (
          <ReplyPreview onClearReply={onClearReply} replyTo={replyTo} />
        ) : null}

        <GestureDetector gesture={composerGesture}>
          <Animated.View
            style={[
              styles.composerShell,
              {
                paddingBottom: insets.bottom + COMPOSER_PADDING.bottom,
                ...(includeHorizontalSafeArea
                  ? {
                      paddingLeft: COMPOSER_PADDING.horizontal + insets.left,
                      paddingRight: COMPOSER_PADDING.horizontal + insets.right,
                    }
                  : null),
              },
              composerAnimatedStyle,
            ]}
          >
            {Platform.OS === 'ios' ? null : <View style={styles.swipeHandle} />}
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <ChatComposer
                  {...{
                    ref: inputRef,
                    onChangeText,
                    onSubmit,
                    onPressAdd: onOpenEmoteSheet,
                    onAttachImage,
                    onOpenSettings: onOpenSettingsSheet,
                    isUploadingImage,
                    placeholder: inputPlaceholder,
                    canSend,
                    reservedCharacters,
                  }}
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
    paddingHorizontal: COMPOSER_PADDING.horizontal,
    paddingTop: Platform.select({ ios: theme.space4, default: 0 }),
  },
  inputContainer: {
    flex: 1,
    minWidth: 0,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: COMPOSER_ROW_GAP,
    paddingTop: Platform.select({ ios: 0, default: 4 }),
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
