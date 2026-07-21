import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import type { FollowedChannelWithProfile } from '@app/types/twitch/channel';

import { Button } from '../Button/Button';
import { Image } from '../Image/Image';

interface Props {
  channel: FollowedChannelWithProfile;
}

function OfflineChannelRow({ channel }: Props) {
  const { t } = useTranslation('stream');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const avatarInitial = channel.broadcaster_name.trim().charAt(0).toUpperCase();

  const colorStyles = useMemo(
    () => ({
      avatarFallback: { backgroundColor: theme.color.pressedOverlay[scheme] },
      avatarInitial: { color: theme.color.text[scheme] },
    }),
    [scheme],
  );

  const handlePressIn = useCallback(() => {
    router.prefetch(`/streams/streamer-profile/${channel.broadcaster_login}`);
  }, [channel.broadcaster_login]);

  const handlePress = useCallback(() => {
    router.push(`/streams/streamer-profile/${channel.broadcaster_login}`);
  }, [channel.broadcaster_login]);

  return (
    <Button
      label={t('viewOfflineChannel', { name: channel.broadcaster_name })}
      onPress={handlePress}
      onPressIn={handlePressIn}
      style={styles.row}
    >
      {channel.profile_image_url ? (
        <Image
          source={channel.profile_image_url}
          style={styles.avatarImage}
          containerStyle={styles.avatarImageWrapper}
          transition={150}
        />
      ) : (
        <View style={[styles.avatarFallback, colorStyles.avatarFallback]}>
          <Text type='sm' weight='bold' style={colorStyles.avatarInitial}>
            {avatarInitial}
          </Text>
        </View>
      )}
      <Text numberOfLines={1} type='sm' weight='semibold' style={styles.name}>
        {channel.broadcaster_name}
      </Text>
    </Button>
  );
}

export const MemoizedOfflineChannelRow = memo(OfflineChannelRow);

const styles = StyleSheet.create({
  avatarFallback: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarImage: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 36,
    width: 36,
  },
  avatarImageWrapper: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 36,
    overflow: 'hidden',
    width: 36,
  },
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
