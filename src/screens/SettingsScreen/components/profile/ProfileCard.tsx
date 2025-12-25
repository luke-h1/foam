import { Icon } from '@app/components/Icon';
import { Image } from '@app/components/Image';
import { PressableArea } from '@app/components/PressableArea';
import { Typography } from '@app/components/Typography';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { resetRoot } from '@app/navigators/navigationUtilities';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

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
  const { theme } = useUnistyles();

  const sheetRef = useRef<BottomSheetModal>(null);

  const handleLogout = () => {
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
          description: 'Manage your blocked users list',
          icon: 'user-x',
          onPress: () => {},
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
          <Typography size="xl" fontWeight="bold" align="center" mb="sm">
            Welcome to Foam
          </Typography>
          <Typography
            size="sm"
            color="gray.textLow"
            align="center"
            style={styles.loginDescription}
          >
            Sign in with your Twitch account to chat, follow streams, and unlock
            all features
          </Typography>
          <PressableArea
            style={styles.loginButton}
            onPress={() => navigate('Login')}
          >
            <Icon
              icon="log-in"
              size={20}
              color={theme.colors.accent.contrast}
            />
            <Typography fontWeight="semiBold" color="accent" contrast size="md">
              Sign in with Twitch
            </Typography>
          </PressableArea>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.main}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Profile Header */}
      <PressableArea
        style={styles.profileHeader}
        onPress={() => sheetRef.current?.present()}
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
          <Typography size="lg" fontWeight="bold">
            {user.display_name}
          </Typography>
          <Typography size="sm" color="gray.textLow">
            Signed in • Tap to view profile
          </Typography>
        </View>
        <Icon
          icon="chevron-right"
          size={20}
          color={theme.colors.gray.textLow}
        />
      </PressableArea>

      {/* Menu Section */}
      <View style={styles.section}>
        <Typography
          size="xs"
          fontWeight="semiBold"
          color="gray.textLow"
          style={styles.sectionTitle}
        >
          ACCOUNT
        </Typography>
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
                <Typography
                  fontWeight="semiBold"
                  color={item.variant === 'danger' ? 'red' : 'gray'}
                >
                  {item.title}
                </Typography>
                {item.description && (
                  <Typography size="xs" color="gray.textLow">
                    {item.description}
                  </Typography>
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
          <Typography fontWeight="semiBold" color="red">
            Sign Out
          </Typography>
        </PressableArea>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  main: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing['3xl'],
    gap: theme.spacing.xl,
  },
  // Login card styles
  loginCard: {
    backgroundColor: theme.colors.gray.uiAlpha,
    borderRadius: theme.radii.xl,
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.gray.borderAlpha,
  },

  loginIconContainer: {
    marginBottom: theme.spacing.xl,
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
    marginBottom: theme.spacing.xl,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.accent.accent,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
    borderRadius: theme.radii.lg,
    width: '100%',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray.uiAlpha,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray.borderAlpha,
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
    backgroundColor: theme.colors.gray.ui,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gray.border,
    borderStyle: 'dashed',
  },
  profileInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  // Section styles
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    marginLeft: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: theme.colors.gray.uiAlpha,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.gray.borderAlpha,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray.borderAlpha,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.accent.uiAlpha,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: theme.colors.red.uiAlpha,
  },
  menuContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  // Logout styles
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.red.uiAlpha,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.red.borderAlpha,
  },
}));
