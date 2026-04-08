import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { Modal } from '@app/components/Modal/Modal';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { resetRoot } from '@app/navigators/navigationUtilities';
import { theme } from '@app/styles/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

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
  const { navigate } = useAppNavigation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    void logout();

    setTimeout(() => {
      resetRoot({
        index: 0,
        routes: [
          {
            name: 'Tabs',
            state: {
              index: 0,
              routes: [{ name: 'Top' }],
            },
          },
        ],
      });
    }, 300);
  };

  const menuItems: ProfileMenuItem[] = user
    ? [
        {
          title: 'My Channel',
          description: 'View your channel',
          icon: 'tv',
          onPress: () =>
            navigate('Streams', {
              screen: 'StreamerProfile',
              params: { id: user.id },
            }),
        },
        {
          title: 'Blocked Users',
          description: 'Manage blocked users',
          icon: 'user-x',
          onPress: () =>
            navigate('Preferences', {
              screen: 'BlockedUsers',
            }),
        },
      ]
    : [];

  if (!user) {
    return (
      <ScrollView
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.loginCard}>
          <LinearGradient
            colors={[
              theme.colors.accent.uiAlpha,
              theme.colors.accent.bgAltAlpha,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.loginIconContainer}>
            <View style={styles.loginIconCircle}>
              <Icon icon="user" size={32} color={theme.colors.accent.accent} />
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
            onPress={() => navigate('Login')}
          >
            <Icon
              icon="log-in"
              size={20}
              color={theme.colors.accent.contrast}
            />
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
        style={styles.main}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <PressableArea
          style={styles.profileHeader}
          onPress={() =>
            navigate('Streams', {
              screen: 'StreamerProfile',
              params: { id: user.id },
            })
          }
        >
          <View style={styles.avatarContainer}>
            {user.profile_image_url ? (
              <Image
                source={{ uri: user.profile_image_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon icon="user" size={28} color={theme.colors.gray.textLow} />
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
            color={theme.colors.gray.textLow}
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
                        ? theme.colors.red.accent
                        : theme.colors.accent.accent
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
                  color={theme.colors.gray.border}
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
  avatar: {
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    width: 56,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.ui,
    borderColor: theme.colors.gray.border,
    borderRadius: 28,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent.accent,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    width: '100%',
  },
  loginCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderColor: theme.colors.gray.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: theme.spacing['2xl'],
  },
  loginDescription: {
    marginBottom: theme.spacing.xl,
    maxWidth: 280,
  },
  loginIconCircle: {
    alignItems: 'center',
    borderRadius: 36,
    borderWidth: 2,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  loginIconContainer: {
    marginBottom: theme.spacing.xl,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.red.uiAlpha,
    borderColor: theme.colors.red.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  main: {
    flex: 1,
  },
  menuCard: {
    backgroundColor: theme.colors.gray.uiAlpha,
    borderColor: theme.colors.gray.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  menuIconContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent.uiAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  menuIconDanger: {
    backgroundColor: theme.colors.red.uiAlpha,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  menuItemBorder: {
    borderBottomColor: theme.colors.gray.borderAlpha,
    borderBottomWidth: 1,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderColor: theme.colors.gray.borderAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  profileInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  scrollContent: {
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing['3xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    marginLeft: theme.spacing.sm,
  },
});
