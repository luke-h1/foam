import { ThemeColor } from '@app/styles/colors';
import { ColorScale } from '@app/styles/util/createPallete';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { IconButton } from '../IconButton/IconButton';
import { Image } from '../Image/Image';
import { Text, TextType, TextWeight } from '../Text/Text';

type NestedColorPath = `${ThemeColor}.${ColorScale | 'contrast'}`;

/**
 * Unified header component that supports both standard and hero layouts
 * API aligned with Text component for consistency
 */
export interface ScreenHeaderProps {
  /**
   * Main title
   */
  title: string;
  /**
   * Optional subtitle displayed below the title
   * mainly for metadata
   */
  subtitle?: string;
  /**
   * Show back button (calls navigation.goBack by default)
   */
  back?: boolean;
  /**
   * Custom back handler
   */
  onBack?: () => void;
  /**
   * Optional content to render on the right side of the header
   */
  trailing?: ReactNode;
  /**
   * Optional content to render below the title/subtitle
   * For hero variant: use for badges/stats
   * For standard variant: use for any additional content
   */
  children?: ReactNode;
  /**
   * Size variant for the header (Text-like API)
   * - large: Large title below nav row (default)
   * - medium: Inline title in nav row
   * - compact: Smaller inline title
   * - hero: Hero-style header with background
   */
  size?: 'large' | 'medium' | 'compact' | 'hero';
  type?: TextType;
  weight?: TextWeight;
  color?: ThemeColor | NestedColorPath;
  subtitleType?: TextType;
  subtitleColor?: ThemeColor | NestedColorPath;
  /**
   * Whether to add top safe area padding
   */
  safeArea?: boolean;
  /**
   * Hero variant: Background image URL
   */
  backgroundImage?: string;
  /**
   * Hero variant: Featured image (e.g., category box art, profile picture)
   */
  featuredImage?: string;
  /**
   * Hero variant: Height of the hero background
   */
  heroHeight?: number;
}

export function ScreenHeader({
  title,
  subtitle,
  back = true,
  onBack,
  trailing,
  children,
  size = 'large',
  type,
  weight,
  color,
  subtitleType,
  subtitleColor = 'gray.textLow',
  safeArea = true,
  backgroundImage,
  featuredImage,
  heroHeight = 280,
}: ScreenHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = onBack ?? (() => navigation.goBack());

  const isHero = size === 'hero';
  const isInline = size === 'medium' || size === 'compact';

  const getTitleType = (): TextType => {
    if (type) return type;
    if (size === 'large') return '2xl';
    if (size === 'medium') return 'lg';
    if (size === 'hero') return 'xl';
    return 'md';
  };

  const getTitleWeight = (): TextWeight => {
    if (weight) return weight;
    if (isHero || size === 'large') return 'bold';
    return 'semibold';
  };

  const getSubtitleType = (): TextType => {
    if (subtitleType) return subtitleType;
    return size === 'compact' ? 'xs' : 'sm';
  };

  const titleTypeValue = getTitleType();
  const titleWeightValue = getTitleWeight();
  const titleColorValue = color;
  const subtitleTypeValue = getSubtitleType();

  // Only show nav row if there's something to display (back button, inline title, or trailing)
  const showNavRow = back || isInline || trailing;

  if (isHero) {
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
          <View style={styles.navRow(safeArea ? insets.top + 8 : 8)}>
            {back && (
              <IconButton
                icon={{ type: 'symbol', name: 'chevron.left', size: 20 }}
                label="goBack"
                onPress={handleBack}
                size="2xl"
                hitSlop={12}
              />
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
              <Text
                type={titleTypeValue}
                weight={titleWeightValue}
                color={titleColorValue}
                style={styles.heroTitle}
                numberOfLines={2}
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  type={subtitleTypeValue}
                  color={subtitleColor}
                  style={styles.subtitle}
                >
                  {subtitle}
                </Text>
              )}
              {children}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.standardContainer,
        safeArea && { paddingTop: insets.top + 8 },
      ]}
    >
      {showNavRow && (
        <View style={styles.standardNavRow}>
          {back && (
            <IconButton
              icon={{ type: 'symbol', name: 'chevron.left', size: 20 }}
              label="goBack"
              onPress={handleBack}
              size="2xl"
              hitSlop={12}
              style={styles.backButton}
            />
          )}

          {isInline ? (
            <View style={styles.inlineTitleSection}>
              <Text
                type={titleTypeValue}
                weight={titleWeightValue}
                color={titleColorValue}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text type={subtitleTypeValue} color={subtitleColor}>
                  {subtitle}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.navSpacer} />
          )}

          {trailing}
        </View>
      )}

      {!isInline && (
        <View
          style={[
            styles.titleSection,
            showNavRow ? styles.titleSectionWithNav : null,
          ]}
        >
          <Text
            type={titleTypeValue}
            weight={titleWeightValue}
            color={titleColorValue}
            style={styles.title}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              type={subtitleTypeValue}
              color={subtitleColor}
              style={styles.subtitle}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  navSpacer: {
    flex: 1,
  },
  textContent: {
    flex: 1,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  title: {
    lineHeight: 34,
  },
  subtitle: {
    lineHeight: 20,
  },
  standardContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  standardNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    marginLeft: -theme.spacing.xs,
    justifyContent: 'center',
  },
  inlineTitleSection: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  titleSection: {
    gap: theme.spacing.xs,
  },
  titleSectionWithNav: {
    marginTop: theme.spacing.xs,
  },

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
  navRow: (top: number) => ({
    position: 'absolute',
    top,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  }),
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
  heroTitle: {
    lineHeight: 28,
  },
}));
