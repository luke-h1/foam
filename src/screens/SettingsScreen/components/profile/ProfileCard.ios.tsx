import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Form,
  Host,
  LabeledContent,
  RNHostView,
  Section,
  Text as NativeText,
} from '@expo/ui/swift-ui';
import { router } from 'expo-router';

import { Image } from '@app/components/Image/Image';
import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

/**
 * Foam has no backend accounts - sign-in is Twitch OAuth - so account deletion
 * is handled by Twitch. This is the Security & Privacy settings page that holds
 * the "Disable or Delete My Account" option.
 */
const TWITCH_ACCOUNT_SETTINGS_URL = 'https://www.twitch.tv/settings/security';

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
        onPress: () => openLinkInBrowser(TWITCH_ACCOUNT_SETTINGS_URL),
      },
    ]);
  };

  if (!user) {
    return (
      <Host style={styles.host}>
        <Form>
          <Section
            footer={<NativeText>{t('signInPromptDescription')}</NativeText>}
          >
            <Button
              label={t('signInWithTwitch')}
              systemImage='arrow.right.square'
              onPress={() => router.push('/auth-sheet')}
            />
          </Section>
        </Form>
      </Host>
    );
  }

  const memberSince = formatMemberSince(user.created_at);

  return (
    <Host style={styles.host}>
      <Form>
        <Section
          title={t('account')}
          footer={<NativeText>{t('userId', { id: user.id })}</NativeText>}
        >
          <RNHostView matchContents>
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
            </View>
          </RNHostView>
          <LabeledContent label={t('channel')}>
            <NativeText>{user.broadcaster_type || t('viewer')}</NativeText>
          </LabeledContent>
          <LabeledContent label={t('memberSince')}>
            <NativeText>{memberSince}</NativeText>
          </LabeledContent>
        </Section>

        <Section title={t('twitch')}>
          <Button
            label={t('myChannel')}
            systemImage='tv'
            onPress={() =>
              router.push(`/streams/streamer-profile/${user.login}`)
            }
          />
          <Button
            label={t('blockedUsers')}
            systemImage='person.crop.circle.badge.xmark'
            onPress={() => router.push('/preferences/blocked-users')}
          />
        </Section>

        <Section
          title={t('session')}
          footer={<NativeText>{t('sessionFooter')}</NativeText>}
        >
          <Button
            label={t('logOut')}
            systemImage='arrow.left.square'
            // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
            role='destructive'
            onPress={confirmLogout}
          />
        </Section>

        <Section footer={<NativeText>{t('deleteAccountFooter')}</NativeText>}>
          <Button
            label={t('deleteAccount')}
            systemImage='trash.fill'
            // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
            role='destructive'
            onPress={confirmDeleteAccount}
          />
        </Section>
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
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
  host: {
    flex: 1,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    // RNHostView content doesn't inherit the SwiftUI row's insets; match them.
    minHeight: 52,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  identityText: {
    flex: 1,
    gap: theme.space4,
  },
});
