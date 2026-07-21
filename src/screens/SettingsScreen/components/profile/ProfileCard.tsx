import { useRef } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
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
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

/**
 * Foam has no backend accounts - sign-in is Twitch OAuth - so account deletion
 * is handled by Twitch. This is the Security & Privacy settings page that holds
 * the "Disable or Delete My Account" option.
 */
const TWITCH_ACCOUNT_SETTINGS_URL = 'https://www.twitch.tv/settings/security';

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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View style={styles.section}>
      {title ? (
        <Text
          type='xxs'
          weight='semibold'
          style={[
            styles.sectionTitle,
            { color: theme.color.textSecondary[scheme] },
          ]}
        >
          {title}
        </Text>
      ) : null}
      <View
        style={[
          styles.sectionBody,
          { backgroundColor: theme.color.backgroundSecondary[scheme] },
        ]}
      >
        {children}
      </View>
      {footer ? <View style={styles.sectionFooter}>{footer}</View> : null}
    </View>
  );
}

function InfoRow({ label, value, valueColor }: InfoRowProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  return (
    <View
      style={[styles.row, { borderBottomColor: theme.color.border[scheme] }]}
    >
      <Text
        type='sm'
        weight='medium'
        style={[styles.rowLabel, { color: theme.color.text[scheme] }]}
      >
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
  color,
  destructive = false,
  showChevron = true,
}: ActionRowProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const iconColor = destructive
    ? theme.color.danger[scheme]
    : (color ?? theme.color.text[scheme]);

  return (
    <PressableArea style={styles.pressableFill} onPress={onPress}>
      <View
        style={[
          styles.actionRow,
          { borderBottomColor: theme.color.border[scheme] },
        ]}
      >
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
            tintColor={theme.color.textSecondary[scheme]}
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
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
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

  const confirmDeleteAccount = () => {
    Alert.alert(t('deleteAccount'), t('deleteAccountMessage'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('deleteAccountContinue'),
        style: 'destructive',
        onPress: () => openLinkInBrowser(TWITCH_ACCOUNT_SETTINGS_URL, scheme),
      },
    ]);
  };

  if (!user) {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.main}
        contentContainerStyle={[
          styles.scrollContent,
          styles.scrollContentCentered,
        ]}
        contentInsetAdjustmentBehavior='automatic'
      >
        <ProfileSection>
          <View style={styles.signInPrompt}>
            <View
              style={[
                styles.signInIcon,
                { backgroundColor: theme.color.backgroundElement[scheme] },
              ]}
            >
              <SymbolView
                name='person'
                size={30}
                tintColor={theme.color.textSecondary[scheme]}
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
              <View
                style={[
                  styles.primaryButton,
                  { backgroundColor: theme.color.accent[scheme] },
                ]}
              >
                <SymbolView
                  name='arrow.right.square'
                  size={18}
                  tintColor={theme.colorWhite}
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
          <View
            style={[
              styles.identityRow,
              { borderBottomColor: theme.color.border[scheme] },
            ]}
          >
            {user.profile_image_url ? (
              <Image
                source={{ uri: user.profile_image_url }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.color.backgroundElement[scheme] },
                ]}
              >
                <SymbolView
                  name='person'
                  size={26}
                  tintColor={theme.color.textSecondary[scheme]}
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
              tintColor={theme.color.textSecondary[scheme]}
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
          onPress={() => router.push(`/streams/streamer-profile/${user.login}`)}
        />
        <ActionRow
          title={t('blockedUsers')}
          icon='person.crop.circle.badge.xmark'
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

      <ProfileSection
        footer={
          <Text type='xxs' color='gray.textLow' style={styles.footerText}>
            {t('deleteAccountFooter')}
          </Text>
        }
      >
        <ActionRow
          title={t('deleteAccount')}
          icon='trash.fill'
          destructive
          showChevron={false}
          onPress={confirmDeleteAccount}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space16,
    paddingHorizontal: theme.space16,
    paddingVertical: 14,
  },
  rowLabel: {
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
  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  section: {
    gap: theme.space8,
  },
  sectionBody: {
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
