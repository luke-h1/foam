import { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import type { PinnedChatMessageViewModel } from '../hooks/usePinnedChatMessage';
import { styles } from '../styles';

export const PinnedMessageBanner = memo(
  ({
    canModerateChat,
    onRefresh,
    onUnpin,
    pinnedMessage,
    pinnedMessageBusy,
  }: {
    canModerateChat: boolean;
    onRefresh: () => void;
    onUnpin: () => void;
    pinnedMessage: PinnedChatMessageViewModel | null;
    pinnedMessageBusy: boolean;
  }) => {
    const { t } = useTranslation('chat');

    if (!pinnedMessage?.text.trim()) {
      return null;
    }

    const title = pinnedMessage.senderName
      ? t('pinned.userPinned', { name: pinnedMessage.senderName })
      : t('pinned.pinnedMessage');

    return (
      <Animated.View
        entering={FadeInUp.duration(200)}
        exiting={FadeOutUp.duration(150)}
        style={styles.pinnedMessageBanner}
      >
        <View style={styles.pinnedIconShell}>
          <SymbolView name='mappin' tintColor={theme.colorWhite} size={16} />
        </View>
        <View style={styles.pinnedMessageContent}>
          <Text
            numberOfLines={1}
            style={styles.pinnedMessageTitle}
            weight='semibold'
          >
            {title}
          </Text>
          <Text numberOfLines={2} style={styles.pinnedMessageText}>
            {pinnedMessage.text}
          </Text>
        </View>
        {canModerateChat ? (
          <View style={styles.pinnedMessageActions}>
            <Button
              disabled={pinnedMessageBusy}
              label={t('pinned.refreshPin')}
              onPress={onRefresh}
              style={styles.pinnedMessageActionButton}
            >
              <SymbolView
                name='arrow.clockwise'
                tintColor='rgba(255,255,255,0.78)'
                size={14}
              />
            </Button>
            <Button
              disabled={pinnedMessageBusy}
              label={t('pinned.unpinMessage')}
              onPress={onUnpin}
              style={styles.pinnedMessageActionButton}
            >
              <SymbolView
                name='xmark'
                tintColor='rgba(255,255,255,0.78)'
                size={15}
              />
            </Button>
          </View>
        ) : null}
      </Animated.View>
    );
  },
);
