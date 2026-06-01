import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { SymbolView } from 'expo-symbols';
import { memo } from 'react';
import { View } from 'react-native';

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
    if (!pinnedMessage?.text.trim()) {
      return null;
    }

    const title = pinnedMessage.senderName
      ? `${pinnedMessage.senderName} pinned`
      : 'Pinned message';

    return (
      <View style={styles.pinnedMessageBanner}>
        <View style={styles.pinnedIconShell}>
          <SymbolView name='mappin' tintColor='#ffffff' size={16} />
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
      </View>
    );
  },
);

PinnedMessageBanner.displayName = 'PinnedMessageBanner';
