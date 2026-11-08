import { useRef } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Image } from '@app/components/image/Image';
import { PressableArea } from '@app/components/pressable-area/PressableArea';
import {
  SettingsLinkRow,
  SettingsRow,
  SettingsSection,
} from '@app/components/settings-section/SettingsSection';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { theme } from '@app/styles/themes';

import {
  confirmDeleteAccount,
  confirmLogout,
  formatMemberSince,
} from './util/profileActions';

export function ProfileCard() {
  const { user, logout } = useAuthContext();
  const scrollRef = useRef<ScrollViewInstance>(null);

  useScrollToTop(scrollRef);

  const memberSince = formatMemberSince(user?.created_at);

  if (!user) {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior='automatic'
      >
        <SettingsSection>
          <View style={styles.signInPrompt}>
            <View style={styles.signInIcon}>
              <SymbolView
                name='person'
                size={30}
                tintColor={theme.colorGreyHoverAlpha}
              />
            </View>
            <Text type='title3' weight='bold' align='center'>
              Not signed in
            </Text>
            <Text
              type='subhead'
              color='gray.textLow'
              align='center'
              style={styles.signInDescription}
            >
              Sign in with Twitch to use chat, follows, channel shortcuts, and
              account controls.
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
                <Text type='subhead' weight='bold' color='accent' contrast>
                  Sign in
                </Text>
              </View>
            </PressableArea>
          </View>
        </SettingsSection>
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
      <SettingsSection
        title='Account'
        footer={
          <Text type='caption' color='gray.textLow' style={styles.footerText}>
            {`User ID: ${user.id}`}
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
            <SymbolView
              name='chevron.right'
              size={18}
              tintColor={theme.colorGreyAlpha}
            />
          </View>
        </PressableArea>

        <SettingsLinkRow
          title='Channel'
          value={user.broadcaster_type || 'Viewer'}
        />
        <SettingsLinkRow title='Member Since' value={memberSince} />
      </SettingsSection>

      <SettingsSection title='Twitch'>
        <SettingsLinkRow
          title='My Channel'
          icon={{ icon: 'tv' }}
          onPress={() => router.push(`/streams/streamer-profile/${user.login}`)}
        />
        <SettingsLinkRow
          title='Blocked Users'
          icon={{ icon: 'person.crop.circle.badge.xmark' }}
          onPress={() => router.push('/preferences/blocked-users')}
        />
      </SettingsSection>

      <SettingsSection
        title='Session'
        footer={
          <Text type='caption' color='gray.textLow' style={styles.footerText}>
            Signing out removes your saved Twitch token from this device.
          </Text>
        }
      >
        <SettingsRow
          title='Log out'
          icon={{ icon: 'arrow.left.square' }}
          danger
          chevron={false}
          onPress={() => confirmLogout(logout)}
        />
      </SettingsSection>

      <SettingsSection
        footer={
          <Text type='caption' color='gray.textLow' style={styles.footerText}>
            {
              "Twitch handles account deletion. This opens Twitch's Security and Privacy settings, where you can disable or delete your account."
            }
          </Text>
        }
      >
        <SettingsRow
          title='Delete Account'
          icon={{ icon: 'trash.fill' }}
          danger
          chevron={false}
          onPress={confirmDeleteAccount}
        />
      </SettingsSection>
    </ScrollView>
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
  footerText: {
    lineHeight: 18,
  },
  identityRow: {
    alignItems: 'center',
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
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.space8,
    justifyContent: 'center',
    marginTop: theme.space8,
    paddingHorizontal: theme.space24,
    paddingVertical: theme.space12,
  },
  scrollContent: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
  signInDescription: {
    lineHeight: 20,
    maxWidth: 300,
  },
  signInIcon: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundElement.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
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
