import { useUserQuery } from '@app/hooks/queries/use-user-query';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { theme } from '@app/styles/themes';
import { formatDate } from '@app/utils/date-time/date';
import { useSelector } from '@legendapp/state/react';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import { useEnsureSevenTvCosmetics } from '../hooks/useEnsureSevenTvCosmetics';
import { PaintedUsername } from './ChatMessage/CosmeticUsername/CosmeticUsername';

interface UserCardHeaderProps {
  fallbackColor?: string;
  login?: string;
  userId?: string;
  username: string;
}

/**
 * Identity block for the user card: Twitch avatar and account age alongside
 * the user's 7TV cosmetics (painted nametag, badge, paint name) — mirroring
 * the 7TV extension's user card header.
 */
export function UserCardHeader({
  fallbackColor,
  login,
  userId,
  username,
}: UserCardHeaderProps) {
  const queryLogin = login ?? username.toLowerCase();
  const { data: user } = useUserQuery(queryLogin, {
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
    ? formatDate(user.created_at, 'MMMM D YYYY')
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
                tintColor='rgba(255,255,255,0.45)'
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
            <Text style={styles.login} numberOfLines={1}>
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
                style={styles.badgeImage}
              />
              <Text style={styles.chipText} numberOfLines={1}>
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
                tintColor='rgba(255,255,255,0.55)'
              />
              <Text style={styles.chipText} numberOfLines={1}>
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
    borderRadius: theme.borderRadius999,
    height: 52,
    width: 52,
  },
  avatarFrame: {
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    padding: 2,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: theme.borderRadius999,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  badgeImage: {
    height: 14,
    width: 14,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
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
    fontSize: theme.fontSize18,
    lineHeight: 22,
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
    fontSize: 13,
    lineHeight: 16,
  },
  paintChip: {
    backgroundColor: 'rgba(46, 134, 255, 0.10)',
    borderColor: 'rgba(46, 134, 255, 0.22)',
  },
  paintChipText: {
    color: theme.colorPrimary,
  },
});
