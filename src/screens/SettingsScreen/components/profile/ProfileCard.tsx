import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Modal } from '@app/components/Modal/Modal';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native';

interface ProfileMenuItem {
  title: string;
  description?: string;
  icon: string;
  iconFamily?: 'Feather' | 'Ionicons';
  onPress?: () => void;
  variant?: 'default' | 'danger';
}

export function ProfileCard() {
  const { user, logout } = useAuthContext();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    void logout();

    setTimeout(() => {
      router.replace('/tabs/top');
    }, 300);
  };

  const menuItems: ProfileMenuItem[] = user
    ? [
        {
          title: 'My Channel',
          description: 'View your channel',
          icon: 'tv',
          onPress: () => router.push(`/streams/streamer-profile/${user.id}`),
        },
        {
          title: 'Blocked Users',
          description: 'Manage blocked users',
          icon: 'user-x',
          onPress: () => router.push('/preferences/blocked-users'),
        },
      ]
    : [];

  if (!user) {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.loginCard}>
          <LinearGradient
            colors={[theme.colorAccentSurface, theme.colorAccentSurface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.loginIconContainer}>
            <View style={styles.loginIconCircle}>
              <Icon icon="user" size={32} color={theme.colorDarkGreen} />
            </View>
          </View>
          <Text type="xl" weight="bold" align="center" mb="sm">
            Welcome to Foam
          </Text>
          <Text
            type="sm"
            color="gray.textLow"
            align="center"
            style={styles.loginDescription}
          >
            Sign in with your Twitch account to chat, follow streams, and unlock
            all features
          </Text>
          <PressableArea
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Icon icon="log-in" size={20} color={theme.colorBlack} />
            <Text weight="semibold" color="accent" contrast type="md">
              Sign in with Twitch
            </Text>
          </PressableArea>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <PressableArea
          style={styles.profileHeader}
          onPress={() => router.push(`/streams/streamer-profile/${user.id}`)}
        >
          <View style={styles.avatarContainer}>
            {user.profile_image_url ? (
              <Image
                source={{ uri: user.profile_image_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon
                  icon="user"
                  size={28}
                  color={theme.color.textSecondary.dark}
                />
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text type="lg" weight="bold">
              {user.display_name}
            </Text>
            <Text type="sm" color="gray.textLow">
              Signed in • Tap to view profile
            </Text>
          </View>
          <Icon
            icon="chevron-right"
            size={20}
            color={theme.color.textSecondary.dark}
          />
        </PressableArea>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text
            type="xs"
            weight="semibold"
            color="gray.textLow"
            style={styles.sectionTitle}
          >
            ACCOUNT
          </Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <PressableArea
                key={item.title}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && styles.menuItemBorder,
                ]}
                onPress={item.onPress}
              >
                <View
                  style={[
                    styles.menuIconContainer,
                    item.variant === 'danger' && styles.menuIconDanger,
                  ]}
                >
                  <Icon
                    icon={item.icon}
                    iconFamily={item.iconFamily}
                    size={18}
                    color={
                      item.variant === 'danger'
                        ? theme.colorRed
                        : theme.colorDarkGreen
                    }
                  />
                </View>
                <View style={styles.menuContent}>
                  <Text
                    weight="semibold"
                    color={item.variant === 'danger' ? 'red' : 'gray'}
                  >
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text type="xs" color="gray.textLow">
                      {item.description}
                    </Text>
                  )}
                </View>
                <Icon
                  icon="chevron-right"
                  size={18}
                  color={theme.color.border.dark}
                />
              </PressableArea>
            ))}
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <PressableArea style={styles.logoutButton} onPress={handleLogout}>
            <Text weight="semibold" color="red">
              Sign Out
            </Text>
          </PressableArea>
        </View>
      </ScrollView>

      <Modal
        title="Sign Out"
        subtitle="Are you sure you want to sign out of your account?"
        confirmOnPress={{
          cta: confirmLogout,
          label: 'Sign Out',
        }}
        cancelOnPress={{
          cta: () => setShowLogoutModal(false),
          label: 'Cancel',
        }}
        isVisible={showLogoutModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.space20,
    paddingTop: theme.space20,
    paddingBottom: theme.space44,
    gap: theme.space28,
  },
  // Login card styles
  loginCard: {
    backgroundColor: theme.darkActiveContent,
    borderRadius: theme.borderRadius28,
    padding: theme.space36,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colorBorderSecondary,
  },

  loginIconContainer: {
    marginBottom: theme.space28,
  },
  loginIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  loginDescription: {
    maxWidth: 280,
    marginBottom: theme.space28,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space16,
    backgroundColor: theme.colorDarkGreen,
    paddingVertical: theme.space20,
    paddingHorizontal: theme.space36,
    borderRadius: theme.borderRadius20,
    width: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderRadius: theme.borderRadius28,
    padding: theme.space20,
    gap: theme.space20,
    borderWidth: 1,
    borderColor: theme.colorBorderSecondary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.color.backgroundSecondary.dark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.color.border.dark,
    borderStyle: 'dashed',
  },
  profileInfo: {
    flex: 1,
    gap: theme.space8,
  },
  // Section styles
  section: {
    gap: theme.space12,
  },
  sectionTitle: {
    marginLeft: theme.space12,
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: theme.darkActiveContent,
    borderRadius: theme.borderRadius20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colorBorderSecondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.space20,
    gap: theme.space20,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colorBorderSecondary,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius16,
    backgroundColor: theme.colorAccentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: theme.colorRedSurface,
  },
  menuContent: {
    flex: 1,
    gap: theme.space8,
  },
  // Logout styles
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space16,
    backgroundColor: theme.colorRedSurface,
    padding: theme.space20,
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    borderColor: theme.colorRedBorderAlpha,
  },
});
