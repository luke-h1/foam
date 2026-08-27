import { Alert, StyleSheet, View } from 'react-native';

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
import { SWIFTUI_ROW_CONTENT_INSET } from '@app/styles/nativeForm';
import { theme } from '@app/styles/themes';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';

import { FormNavigationRow } from '../FormNavigationRow';

/**
 * Foam has no backend accounts (sign-in is Twitch OAuth), so deletion goes through Twitch's Security & Privacy page with "Disable or Delete My Account".
 */
const TWITCH_ACCOUNT_SETTINGS_URL = 'https://www.twitch.tv/settings/security';

function formatMemberSince(createdAt?: string) {
  if (!createdAt) {
    return 'Unknown';
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function confirmDeleteAccount() {
  Alert.alert(
    'Delete Account',
    "Foam doesn't have its own accounts - you sign in with your Twitch account, which is managed by Twitch. To permanently delete your account, continue to Twitch's account settings. To just remove your saved login from this device, use Log out above.",
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue to Twitch',
        style: 'destructive',
        onPress: () => openLinkInBrowser(TWITCH_ACCOUNT_SETTINGS_URL),
      },
    ],
  );
}

export function ProfileCard() {
  const { user, logout } = useAuthContext();

  const confirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
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
      ],
    );
  };

  if (!user) {
    return (
      <Host style={styles.host}>
        <Form>
          <Section
            footer={
              <NativeText>
                Sign in with Twitch to use chat, follows, channel shortcuts, and
                account controls.
              </NativeText>
            }
          >
            <Button
              label='Sign in with Twitch'
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
          title='Account'
          footer={<NativeText>{`User ID: ${user.id}`}</NativeText>}
        >
          <RNHostView matchContents>
            <View style={styles.identityRow}>
              {user.profile_image_url ? (
                <Image
                  source={{ uri: user.profile_image_url }}
                  cacheVariant='avatar'
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
          <LabeledContent label='Channel'>
            <NativeText>{user.broadcaster_type || 'Viewer'}</NativeText>
          </LabeledContent>
          <LabeledContent label='Member Since'>
            <NativeText>{memberSince}</NativeText>
          </LabeledContent>
        </Section>

        <Section title='Twitch'>
          <FormNavigationRow
            label='My Channel'
            systemImage='tv'
            onPress={() =>
              router.push(`/streams/streamer-profile/${user.login}`)
            }
          />
          <FormNavigationRow
            label='Blocked Users'
            systemImage='person.crop.circle.badge.xmark'
            onPress={() => router.push('/preferences/blocked-users')}
          />
        </Section>

        <Section
          title='Session'
          footer={
            <NativeText>
              Signing out removes your saved Twitch token from this device.
            </NativeText>
          }
        >
          <Button
            label='Log out'
            systemImage='arrow.left.square'
            // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
            role='destructive'
            onPress={confirmLogout}
          />
        </Section>

        <Section
          footer={
            <NativeText>
              {
                "Account deletion is handled by Twitch. This opens Twitch's Security and Privacy settings, where you can disable or delete your account."
              }
            </NativeText>
          }
        >
          <Button
            label='Delete Account'
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
    minHeight: 52,
    paddingHorizontal: SWIFTUI_ROW_CONTENT_INSET,
    paddingVertical: theme.space8,
  },
  identityText: {
    flex: 1,
    gap: theme.space4,
  },
});
