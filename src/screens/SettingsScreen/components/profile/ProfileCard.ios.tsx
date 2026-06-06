import { Image } from '@app/components/Image/Image';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { theme } from '@app/styles/themes';
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
import { SymbolView } from 'expo-symbols';
import { Alert, StyleSheet, View } from 'react-native';

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
          footer={<NativeText>User ID: {user.id}</NativeText>}
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
          <LabeledContent label='Channel'>
            <NativeText>{user.broadcaster_type || 'Viewer'}</NativeText>
          </LabeledContent>
          <LabeledContent label='Member Since'>
            <NativeText>{memberSince}</NativeText>
          </LabeledContent>
        </Section>

        <Section title='Twitch'>
          <Button
            label='My Channel'
            systemImage='tv'
            onPress={() => router.push(`/streams/streamer-profile/${user.id}`)}
          />
          <Button
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
    paddingVertical: theme.space8,
  },
  identityText: {
    flex: 1,
    gap: theme.space4,
  },
});
