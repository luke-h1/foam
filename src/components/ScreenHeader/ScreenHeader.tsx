import {
  theme,
  type ThemeColor,
  type ThemeColorToken,
} from '@app/styles/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '../IconButton/IconButton';
import { Image } from '../Image/Image';
import { Text, TextType, TextWeight } from '@app/components/ui/Text/Text';

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
   * Optional share action rendered as a trailing icon button
   */
  share?: {
    label: string;
    onPress: () => void;
  };
  /**
   * Optional content to render below the title/subtitle
   * For hero variant: use for badges/stats
   * For standard variant: use for any additional content
   */
  children?: ReactNode;
  /**
   * Size variant for the header (Text-like API)
   * - large/medium: primary bold title block
   * - compact: Small inline title in nav row
   * - hero: Hero-style header with background
   */
  size?: 'large' | 'medium' | 'compact' | 'hero';
  type?: TextType;
  weight?: TextWeight;
  color?: ThemeColor | ThemeColorToken;
  subtitleType?: TextType;
  subtitleColor?: ThemeColor | ThemeColorToken;
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
  share,
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
  const insets = useSafeAreaInsets();

  const handleBack =
    onBack ??
    (() => {
      if (router.canGoBack()) {
        router.back();
      }
    });

  const isHero = size === 'hero';
  const isInline = size === 'compact';

  const getTitleType = (): TextType => {
    if (type) {
      return type;
    }
    if (size === 'large' || size === 'medium') {
      return '4xl';
    }
    if (size === 'hero') {
      return 'xl';
    }
    return 'md';
  };

  const getTitleWeight = (): TextWeight => {
    if (weight) {
      return weight;
    }
    if (isHero || size === 'large' || size === 'medium') {
      return 'bold';
    }
    return 'semibold';
  };

  const getSubtitleType = (): TextType => {
    if (subtitleType) {
      return subtitleType;
    }
    return size === 'compact' ? 'xs' : 'xs';
  };

  const titleTypeValue = getTitleType();
  const titleWeightValue = getTitleWeight();
  const titleColorValue = color;
  const subtitleTypeValue = getSubtitleType();

  const shareButton = share ? (
    <IconButton
      icon={{ type: 'symbol', name: 'square.and.arrow.up', size: 18 }}
      label={share.label}
      onPress={share.onPress}
      size='2xl'
    />
  ) : null;
  const navTrailing = shareButton ?? trailing;

  // Only show nav row if there's something to display (back button, inline title, or trailing)
  const showNavRow = back || isInline || navTrailing;

  if (isHero) {
    return (
      <View style={styles.container}>
        {backgroundImage && (
          <View style={[styles.heroBackground, { height: heroHeight }]}>
            <Image
              source={backgroundImage}
              style={styles.heroBackgroundImage}
              contentFit='cover'
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)', 'rgba(0,0,0,1)']}
              locations={[0, 0.6, 1]}
              style={styles.heroGradient}
            />
          </View>
        )}

        {(back || navTrailing) && (
          <View
            style={[
              styles.navRow,
              getNavRowOffsetStyle(safeArea ? insets.top + 8 : 8),
            ]}
          >
            {back && (
              <IconButton
                icon={{ type: 'symbol', name: 'chevron.left', size: 20 }}
                label='goBack'
                onPress={handleBack}
                size='2xl'
                hitSlop={12}
              />
            )}
            <View style={styles.navSpacer} />
            {navTrailing}
          </View>
        )}

        {/* Hero content */}
        <View
          style={[
            styles.heroContent,
            getHeroContentOffsetStyle(Boolean(backgroundImage)),
          ]}
        >
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
              label='goBack'
              onPress={handleBack}
              size='2xl'
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

          {navTrailing}
        </View>
      )}

      {!isInline && (
        <View
          style={[
            styles.titleSection,
            showNavRow ? styles.titleSectionWithNav : null,
          ]}
        >
          {subtitle && (
            <Text
              type={subtitleTypeValue}
              weight='semibold'
              color={subtitleColor}
              style={styles.standardEyebrow}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
          <Text
            type={titleTypeValue}
            weight={titleWeightValue}
            color={titleColorValue}
            style={styles.standardTitle}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    justifyContent: 'center',
    marginLeft: -theme.space8,
  },
  container: {
    position: 'relative',
  },
  featuredImage: {
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    height: 134,
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
    width: 100,
  },
  heroBackground: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroBackgroundImage: {
    height: '100%',
    opacity: 0.4,
    width: '100%',
  },
  heroContent: {
    paddingBottom: theme.space28,
    paddingHorizontal: theme.space20,
  },
  heroGradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroInner: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.space16,
  },
  heroTitle: {
    lineHeight: 28,
  },
  inlineTitleSection: {
    flex: 1,
    marginLeft: theme.space12,
  },

  navRow: {
    alignItems: 'center',
    flexDirection: 'row',
    left: theme.space20,
    position: 'absolute',
    right: theme.space20,
    zIndex: 10,
  },
  navSpacer: {
    flex: 1,
  },
  standardContainer: {
    paddingBottom: theme.space20,
    paddingHorizontal: theme.space20,
  },
  standardNavRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.space8,
    minHeight: 52,
  },
  standardEyebrow: {
    letterSpacing: 1,
    marginBottom: theme.space8,
    textTransform: 'uppercase',
  },
  standardTitle: {
    lineHeight: 44,
  },
  subtitle: {
    lineHeight: 20,
  },
  textContent: {
    flex: 1,
    gap: theme.space12,
    paddingBottom: theme.space8,
  },
  titleSection: {
    gap: theme.space8,
  },
  titleSectionWithNav: {
    marginTop: 0,
  },
});

function getNavRowOffsetStyle(top: number) {
  return { top };
}

function getHeroContentOffsetStyle(hasBackgroundImage: boolean) {
  return {
    paddingTop: hasBackgroundImage ? 100 : 80,
  };
}
