import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { ActionButton } from '@app/components/action-button/action-button';
import { Image } from '@app/components/image/image';
import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';

interface StreamUnavailablePanelProps {
  channelLogin: string;
  displayName?: string;
  onRetry: () => void;
  profileImageUrl?: string;
  reason: 'offline' | 'error';
}

export function StreamUnavailablePanel({
  channelLogin,
  displayName,
  onRetry,
  profileImageUrl,
  reason,
}: StreamUnavailablePanelProps) {
  const name = displayName ?? channelLogin;
  const isOffline = reason === 'offline';

  return (
    <View style={styles.panel} testID='stream-unavailable-panel'>
      {isOffline && profileImageUrl ? (
        <Image
          source={profileImageUrl}
          cacheVariant='avatar'
          style={styles.avatar}
          containerStyle={styles.avatarContainer}
          contentFit='cover'
        />
      ) : (
        <SymbolView
          name={isOffline ? 'moon.zzz' : 'exclamationmark.triangle'}
          size={40}
          tintColor={theme.color.textSecondary.dark}
        />
      )}

      <Text type='headline' weight='semibold' align='center' numberOfLines={1}>
        {isOffline ? `${name} is offline` : "Couldn't load this stream"}
      </Text>
      <Text type='subhead' color='gray.textLow' align='center'>
        {isOffline
          ? 'Chat stays open. Catch up on past broadcasts and clips.'
          : 'Check your connection and try again.'}
      </Text>

      <ActionButton
        title={isOffline ? 'Videos and clips' : 'Try again'}
        size='small'
        haptic='selection'
        style={styles.action}
        onPress={
          isOffline
            ? () => router.push(`/streams/streamer-profile/${channelLogin}`)
            : onRetry
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    marginTop: theme.space12,
  },
  avatar: {
    height: 64,
    width: 64,
  },
  avatarContainer: {
    borderRadius: theme.radius.full,
    height: 64,
    overflow: 'hidden',
    width: 64,
  },
  panel: {
    alignItems: 'center',
    bottom: 0,
    gap: theme.space8,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: theme.space24,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
