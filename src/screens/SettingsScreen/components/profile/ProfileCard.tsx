import { useRef } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import { Image } from '@app/components/Image/Image';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';

interface ProfileSectionProps {
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
}

interface InfoRowProps {
  label: string;
  value: ReactNode;
  valueColor?: string;
}

interface ActionRowProps {
  title: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  color?: string;
  destructive?: boolean;
  showChevron?: boolean;
}

function ProfileSection({ title, footer, children }: ProfileSectionProps) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text type='xxs' weight='semibold' style={styles.sectionTitle}>
          {title}
        </Text>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
      {footer ? <View style={styles.sectionFooter}>{footer}</View> : null}
    </View>
  );
}

function InfoRow({ label, value, valueColor }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text type='sm' weight='medium' style={styles.rowLabel}>
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text
          type='xs'
          color='gray.textLow'
          numberOfLines={1}
          style={[styles.rowValue, valueColor ? { color: valueColor } : null]}
        >
          {value}
        </Text>
      ) : (
        <View style={styles.rowValueWrapper}>{value}</View>
      )}
    </View>
  );
}

function ActionRow({
  title,
  icon,
  onPress,
  color = theme.colorWhite,
  destructive = false,
  showChevron = true,
}: ActionRowProps) {
  const iconColor = destructive ? theme.colorRed : color;

  return (
    <PressableArea style={styles.pressableFill} onPress={onPress}>
      <View style={styles.actionRow}>
        <SymbolView name={icon} size={20} tintColor={iconColor} />
        <Text
          type='sm'
          weight='medium'
          style={[styles.actionLabel, { color: iconColor }]}
        >
          {title}
        </Text>
        {showChevron ? (
          <SymbolView
            name='chevron.right'
            size={18}
            tintColor={theme.colorGreyAlpha}
          />
        ) : null}
      </View>
    </PressableArea>
  );
}

function formatMemberSince(createdAt?: string) {
  if (!createdAt) {
    return i18next.t('settings:unknown');
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return i18next.t('settings:unknown');
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function ProfileCard() {
  const { t } = useTranslation(['settings', 'common']);
  const { user, logout } = useAuthContext();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  const memberSince = formatMemberSince(user?.created_at);

  const confirmLogout = () => {
    Alert.alert(t('signOut'), t('signOutConfirm'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('signOut'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await logout();
            setTimeout(() => {
              router.replace('/tabs/top');
            }, 300);
          })();
        },
      },
    ]);
  };

  if (!user) {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior='automatic'
      >
        <ProfileSection>
          <View style={styles.signInPrompt}>
            <View style={styles.signInIcon}>
              <SymbolView
                name='person'
                size={30}
                tintColor={theme.colorGreyHoverAlpha}
              />
            </View>
            <Text type='lg' weight='bold' align='center'>
              {t('notSignedIn')}
            </Text>
            <Text
              type='xs'
              color='gray.textLow'
              align='center'
              style={styles.signInDescription}
            >
              {t('signInPromptDescription')}
            </Text>
            <PressableArea
              style={styles.pressableFill}
              onPress={() => router.push('/auth-sheet')}
            >
              <View style={styles.primaryButton}>
                <SymbolView
                  name='arrow.right.square'
                  size={18}
                  tintColor={theme.colorBlack}
                />
                <Text type='xs' weight='bold' color='accent' contrast>
                  {t('signInShort')}
                </Text>
              </View>
            </PressableArea>
          </View>
        </ProfileSection>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.main}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior='automatic'
      showsVerticalScrollIndicator={false}
    >
      <ProfileSection
        title={t('account')}
        footer={
          <Text type='xxs' color='gray.textLow' style={styles.footerText}>
            {t('userId', { id: user.id })}
          </Text>
        }
      >
        <PressableArea
          style={styles.pressableFill}
          onPress={() => router.push(`/streams/streamer-profile/${user.login}`)}
        >
          <View style={styles.identityRow}>
            {user.profile_image_url ? (
              <Image
                source={{ uri: user.profile_image_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <SymbolView
                  name='person'
                  size={26}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              </View>
            )}
            <View style={styles.identityText}>
              <Text type='lg' weight='bold' numberOfLines={1}>
                {user.display_name}
              </Text>
              <Text type='xs' color='gray.textLow' numberOfLines={1}>
                @{user.login}
              </Text>
            </View>
            <SymbolView
              name='chevron.right'
              size={18}
              tintColor={theme.colorGreyAlpha}
            />
          </View>
        </PressableArea>

        <InfoRow
          label={t('channel')}
          value={user.broadcaster_type || t('viewer')}
        />
        <InfoRow label={t('memberSince')} value={memberSince} />
      </ProfileSection>

      <ProfileSection title={t('twitch')}>
        <ActionRow
          title={t('myChannel')}
          icon='tv'
          color={theme.colorWhite}
          onPress={() => router.push(`/streams/streamer-profile/${user.login}`)}
        />
        <ActionRow
          title={t('blockedUsers')}
          icon='person.crop.circle.badge.xmark'
          color={theme.colorWhite}
          onPress={() => router.push('/preferences/blocked-users')}
        />
      </ProfileSection>

      <ProfileSection
        title={t('session')}
        footer={
          <Text type='xxs' color='gray.textLow' style={styles.footerText}>
            {t('sessionFooter')}
          </Text>
        }
      >
        <ActionRow
          title={t('logOut')}
          icon='arrow.left.square'
          destructive
          showChevron={false}
          onPress={confirmLogout}
        />
      </ProfileSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    flex: 1,
  },
  actionRow: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  avatar: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 52,
    width: 52,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundElement.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  footerText: {
    lineHeight: 18,
  },
  identityRow: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    padding: theme.space16,
  },
  identityText: {
    flex: 1,
    gap: theme.space4,
  },
  main: {
    flex: 1,
  },
  pressableFill: {
    alignSelf: 'stretch',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    flexDirection: 'row',
    gap: theme.space8,
    justifyContent: 'center',
    marginTop: theme.space8,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space12,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space16,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
  rowLabel: {
    color: theme.colorWhite,
    flex: 1,
  },
  rowValue: {
    maxWidth: '58%',
    textAlign: 'right',
  },
  rowValueWrapper: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  scrollContent: {
    gap: theme.space24,
    paddingBottom: theme.space56,
    paddingTop: theme.space16,
  },
  section: {
    gap: theme.space8,
  },
  sectionBody: {
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    marginHorizontal: theme.space16,
    overflow: 'hidden',
  },
  sectionFooter: {
    paddingHorizontal: theme.space16,
    paddingTop: theme.space8,
  },
  sectionTitle: {
    color: theme.colorGreyAlpha,
    letterSpacing: 0.5,
    paddingHorizontal: theme.space16,
    textTransform: 'uppercase',
  },
  signInDescription: {
    lineHeight: 20,
    maxWidth: 300,
  },
  signInIcon: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundElement.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    height: 64,
    justifyContent: 'center',
    marginBottom: theme.space4,
    width: 64,
  },
  signInPrompt: {
    alignItems: 'center',
    gap: theme.space12,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space36,
  },
});
