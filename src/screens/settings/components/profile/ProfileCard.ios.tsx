import { StyleSheet, View } from 'react-native';

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

import { Image } from '@app/components/image/Image';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { SWIFTUI_ROW_CONTENT_INSET } from '@app/styles/native-form';
import { theme } from '@app/styles/themes';

import { FormNavigationRow } from '../FormNavigationRow';
import {
  confirmDeleteAccount,
  confirmLogout,
  formatMemberSince,
} from './util/profileActions';

export function ProfileCard() {
  const { user, logout } = useAuthContext();

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
                <Text type='title3' weight='bold' numberOfLines={1}>
                  {user.display_name}
                </Text>
                <Text type='subhead' color='gray.textLow' numberOfLines={1}>
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
            // oxlint-disable-next-line react-doctor/aria-role -- SwiftUI Button role, not ARIA
            role='destructive'
            onPress={() => confirmLogout(logout)}
          />
        </Section>

        <Section
          footer={
            <NativeText>
              {
                "Twitch handles account deletion. This opens Twitch's Security and Privacy settings, where you can disable or delete your account."
              }
            </NativeText>
          }
        >
          <Button
            label='Delete Account'
            systemImage='trash.fill'
            // oxlint-disable-next-line react-doctor/aria-role -- SwiftUI Button role, not ARIA
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
    borderRadius: theme.radius.lg,
    height: 52,
    width: 52,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundElement.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
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
