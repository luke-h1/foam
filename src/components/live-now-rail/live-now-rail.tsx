import { memo, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { Image } from '@app/components/image/image';
import { PressableArea } from '@app/components/pressable-area/pressable-area';
import { Text } from '@app/components/ui/text/text';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { Color } from '@app/styles/palette';
import { theme } from '@app/styles/themes';
import type { TwitchStream } from '@app/types/twitch/stream';

const MAX_RAIL_ITEMS = 10;

function LiveNowRailItem({ stream }: { stream: TwitchStream }) {
  const queryClient = useQueryClient();
  const initial = stream.user_name.trim().charAt(0).toUpperCase();

  const handlePressIn = useCallback(() => {
    router.prefetch(`/streams/live-stream/${stream.user_login}`);
  }, [stream.user_login]);

  const handlePress = useCallback(() => {
    queryClient.setQueryData(twitchKeys.stream(stream.user_login), stream);
    router.push(`/streams/live-stream/${stream.user_login}`);
  }, [queryClient, stream]);

  return (
    <PressableArea
      accessibilityLabel={`${stream.user_name}, live`}
      onPress={handlePress}
      onPressIn={handlePressIn}
      style={styles.item}
      hitSlop={4}
    >
      <View style={styles.ring}>
        {stream.profilePicture ? (
          <Image
            source={stream.profilePicture}
            style={styles.avatar}
            containerStyle={styles.avatarWrapper}
            transition={150}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text type='md' weight='bold' style={styles.avatarInitial}>
              {initial}
            </Text>
          </View>
        )}
      </View>
      <Text type='xxs' weight='medium' numberOfLines={1} style={styles.name}>
        {stream.user_name}
      </Text>
    </PressableArea>
  );
}

function LiveNowRail({ streams }: { streams: TwitchStream[] }) {
  if (streams.length === 0) {
    return null;
  }

  return (
    // eslint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- capped at MAX_RAIL_ITEMS and hosted as a vertical FlashList header, where a nested horizontal list does not virtualise
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.rail}
    >
      {streams.slice(0, MAX_RAIL_ITEMS).map(stream => (
        <LiveNowRailItem key={stream.id} stream={stream} />
      ))}
    </ScrollView>
  );
}

export const MemoizedLiveNowRail = memo(LiveNowRail);

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  rail: {
    marginBottom: theme.space8,
  },
  content: {
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  item: {
    alignItems: 'center',
    width: AVATAR_SIZE + theme.space8,
  },
  ring: {
    alignItems: 'center',
    borderColor: theme.color.live.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 2,
    height: AVATAR_SIZE + 6,
    justifyContent: 'center',
    width: AVATAR_SIZE + 6,
  },
  avatar: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarWrapper: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: AVATAR_SIZE,
    overflow: 'hidden',
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    width: AVATAR_SIZE,
  },
  avatarInitial: {
    color: Color.zinc[50],
  },
  name: {
    color: Color.zinc[300],
    marginTop: theme.space4,
    maxWidth: AVATAR_SIZE + theme.space8,
    textAlign: 'center',
  },
});
