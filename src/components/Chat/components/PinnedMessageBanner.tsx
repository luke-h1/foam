import { memo } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { Button } from '@app/components/Button/Button';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import type { PinnedChatMessageViewModel } from '../hooks/usePinnedChatMessage';
import { chatEntranceSpring } from '../util/chatEntranceSpring';
import { styles } from './PinnedMessageBanner.styles';

const pinnedBannerEntering = chatEntranceSpring(FadeInUp);
const pinnedBannerExiting = FadeOutUp.duration(150);

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
    if (!pinnedMessage?.text.trim()) {
      return null;
    }

    const title = pinnedMessage.senderName
      ? `${pinnedMessage.senderName} pinned`
      : 'Pinned message';

    return (
      <Animated.View
        entering={pinnedBannerEntering}
        exiting={pinnedBannerExiting}
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
              label='Refresh pin'
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
              label='Unpin message'
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
