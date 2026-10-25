import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { PressableArea } from '@app/components/pressable-area/PressableArea';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';
import type { FollowedChannelWithProfile } from '@app/types/twitch/channel';

import { Avatar } from '../avatar/Avatar';

interface Props {
  channel: FollowedChannelWithProfile;
}

function OfflineChannelRowComponent({ channel }: Props) {
  const handlePressIn = useCallback(() => {
    router.prefetch(`/streams/streamer-profile/${channel.broadcaster_login}`);
  }, [channel.broadcaster_login]);

  const handlePress = useCallback(() => {
    router.push(`/streams/streamer-profile/${channel.broadcaster_login}`);
  }, [channel.broadcaster_login]);

  return (
    <PressableArea
      feedback='highlight'
      accessibilityLabel={`View ${channel.broadcaster_name}`}
      onPress={handlePress}
      onPressIn={handlePressIn}
    >
      <View style={styles.row}>
        <Avatar
          uri={channel.profile_image_url || undefined}
          name={channel.broadcaster_name}
          size={40}
        />
        <Text numberOfLines={1} type='body' style={styles.name}>
          {channel.broadcaster_name}
        </Text>
        <SymbolView
          name='chevron.right'
          size={13}
          weight='semibold'
          tintColor={theme.color.textFaint.dark}
        />
      </View>
    </PressableArea>
  );
}

export const OfflineChannelRow = memo(OfflineChannelRowComponent);

const styles = StyleSheet.create({
  name: {
    flex: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
});
