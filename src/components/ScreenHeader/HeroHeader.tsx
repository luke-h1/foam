import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { IconButton } from '../IconButton';
import { Image } from '../Image';
import { Typography } from '../Typography';

export interface HeroHeaderProps {
  /**
   * Main title to be displayed prominently
   */
  title: string;
  /**
   * Optional subtitle displayed below the title
   * mainly metadata gets displayed here
   */
  subtitle?: string;
  /**
   * Background image URL for the hero section
   */
  backgroundImage?: string;
  /**
   * Featured image (e.g., category box art, profile picture etc.)
   */
  featuredImage?: string;
  /**
   * Whether to show back button
   */
  back?: boolean;
  /**
   * Custom back handler
   */
  onBack?: () => void;
  /**
   * Optional content to render on the right side of the back button row
   */
  trailing?: ReactNode;
  /**
   * Optional badges/stats to display below the title
   */
  badges?: ReactNode;
  /**
   * Optional content to render at the bottom of the hero
   */
  children?: ReactNode;
  /**
   * Height of the hero background
   */
  heroHeight?: number;
  /**
   * Whether to add top safe area padding
   * Set to false when used inside a list with contentInsetAdjustmentBehavior="automatic"
   */
  safeArea?: boolean;
}

export function HeroHeader({
  title,
  subtitle,
  backgroundImage,
  featuredImage,
  back = true,
  onBack,
  trailing,
  badges,
  children,
  heroHeight = 280,
  safeArea = true,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {backgroundImage && (
        <View style={[styles.heroBackground, { height: heroHeight }]}>
          <Image
            source={backgroundImage}
            style={styles.heroBackgroundImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,1)']}
            locations={[0, 0.6, 1]}
            style={styles.heroGradient}
          />
        </View>
      )}

      {(back || trailing) && (
        <View style={[styles.navRow, { top: safeArea ? insets.top + 8 : 8 }]}>
          {back && (
            <IconButton icon="arrowLeft" label="goBack" onPress={onBack} />
          )}
          <View style={styles.navSpacer} />
          {trailing}
        </View>
      )}

      {/* Hero content */}
      <View style={styles.heroContent(backgroundImage)}>
        <View style={styles.heroInner}>
          {featuredImage && (
            <Image source={featuredImage} style={styles.featuredImage} />
          )}
          <View style={styles.textContent}>
            <Typography
              size="xl"
              fontWeight="bold"
              style={styles.title}
              numberOfLines={2}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                size="sm"
                color="gray.textLow"
                style={styles.subtitle}
              >
                {subtitle}
              </Typography>
            )}
            {badges}
          </View>
        </View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    position: 'relative',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  heroBackgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navRow: {
    position: 'absolute',
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  navSpacer: {
    flex: 1,
  },
  heroContent: (backgroundImage?: string) => ({
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    paddingTop: backgroundImage ? 100 : 80,
  }),
  heroInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  featuredImage: {
    width: 100,
    height: 134,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.violet.accent,
    shadowColor: theme.colors.violet.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  textContent: {
    flex: 1,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  title: {
    lineHeight: 28,
  },
  subtitle: {
    lineHeight: 20,
  },
}));
