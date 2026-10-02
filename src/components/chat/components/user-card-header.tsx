import { StyleSheet, View } from 'react-native';

import { useSelector } from '@legendapp/state/react';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { SymbolView } from '@app/components/ui/icon/icon';
import { Text } from '@app/components/ui/text/text';
import { userQueryOptions } from '@app/lib/react-query/queries/twitch';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import { theme } from '@app/styles/themes';
import { formatDate } from '@app/utils/date-time/date';

import { useEnsureSevenTvCosmetics } from '../hooks/use-ensure-seven-tv-cosmetics';
import { PaintedUsername } from './chat-message/cosmetic-username/painted-username';

interface UserCardHeaderProps {
  fallbackColor?: string;
  login?: string;
  userId?: string;
  username: string;
}

/**
 * User card identity block: Twitch avatar and account age plus 7TV cosmetics,
 * mirroring the 7TV extension's user card header.
 */
export function UserCardHeader({
  fallbackColor,
  login,
  userId,
  username,
}: UserCardHeaderProps) {
  const queryLogin = login ?? username.toLowerCase();

  const { data: user } = useQuery({
    ...userQueryOptions(queryLogin),
    enabled: Boolean(queryLogin),
  });

  useEnsureSevenTvCosmetics(userId);

  const paint = useSelector(() => {
    if (!userId) {
      return null;
    }

    const paintId = chatStore$.userPaintIds[userId]?.get();
    return paintId ? (chatStore$.paints[paintId]?.get() ?? null) : null;
  });

  const sevenTvBadge = useSelector(() => {
    if (!userId) {
      return null;
    }

    const badgeId = chatStore$.userBadgeIds[userId]?.get();
    return badgeId ? (chatStore$.badges[badgeId]?.get() ?? null) : null;
  });

  const joinedDate = user?.created_at
    ? formatDate(user.created_at, 'MMMM d yyyy')
    : null;

  const showLogin = Boolean(login) && login !== username.toLowerCase();

  return (
    <View style={styles.container}>
      <View style={styles.identityRow}>
        <View style={styles.avatarFrame}>
          {user?.profile_image_url ? (
            <Image
              source={{ uri: user.profile_image_url }}
              style={styles.avatar}
              transition={120}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <SymbolView
                name='person.fill'
                size={22}
                tintColor={theme.color.textSecondary.dark}
              />
            </View>
          )}
        </View>
        <View style={styles.identityText}>
          <PaintedUsername
            username={username}
            userId={userId}
            fallbackColor={fallbackColor ?? theme.color.text.dark}
            showColon={false}
            usernameTextStyle={styles.displayName}
          />
          {showLogin ? (
            <Text
              type='callout'
              family='brand'
              style={styles.login}
              numberOfLines={1}
            >
              @{login}
            </Text>
          ) : null}
        </View>
      </View>

      {sevenTvBadge || paint || joinedDate ? (
        <View style={styles.chipsRow}>
          {sevenTvBadge?.url ? (
            <View style={styles.chip}>
              <Image
                source={{ uri: sevenTvBadge.url }}
                useAppleWebpCodec={false}
                style={styles.badgeImage}
              />
              <Text
                type='callout'
                family='brand'
                style={styles.chipText}
                numberOfLines={1}
              >
                {sevenTvBadge.title}
              </Text>
            </View>
          ) : null}
          {paint ? (
            <View style={[styles.chip, styles.paintChip]}>
              <SymbolView
                name='paintbrush.fill'
                size={11}
                tintColor={theme.colorPrimary}
              />
              <Text
                type='callout'
                family='brand'
                style={[styles.chipText, styles.paintChipText]}
                numberOfLines={1}
              >
                {paint.name || 'Paint'}
              </Text>
            </View>
          ) : null}
          {joinedDate ? (
            <View style={styles.chip}>
              <SymbolView
                name='birthday.cake'
                size={11}
                tintColor={theme.color.textSecondary.dark}
              />
              <Text
                type='callout'
                family='brand'
                style={styles.chipText}
                numberOfLines={1}
              >
                Joined {joinedDate}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: theme.radius.full,
    height: 56,
    width: 56,
  },
  avatarFrame: {
    borderRadius: theme.radius.full,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.color.surfaceElevated.dark,
    borderRadius: theme.radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  badgeImage: {
    height: 14,
    width: 14,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: theme.color.surfaceElevated.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: theme.space4,
  },
  chipText: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
  },
  container: {
    gap: 10,
  },
  displayName: {
    fontSize: theme.fontSize20,
    lineHeight: 25,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
  },
  identityText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  login: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize14,
    lineHeight: 18,
  },
  paintChip: {
    backgroundColor: theme.color.accentSurface.dark,
  },
  paintChipText: {
    color: theme.colorPrimary,
  },
});
