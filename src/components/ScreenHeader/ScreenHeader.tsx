import { useNavigation } from '@react-navigation/native';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { IconButton } from '../IconButton';
import { Typography } from '../Typography';

/**
 * TODO: unify heroheader props with this type
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
   */
  children?: ReactNode;
  /**
   * Size variant for the header
   * - large: Large title below nav row
   * - medium: Inline title in nav row
   * - compact: Smaller inline title
   */
  size?: 'large' | 'medium' | 'compact';
  /**
   * Whether to add top safe area padding
   */
  safeArea?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  back = true,
  onBack,
  trailing,
  children,
  size = 'large',
  safeArea = true,
}: ScreenHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = onBack ?? (() => navigation.goBack());

  const isInline = size === 'medium' || size === 'compact';

  const getTitleSize = () => {
    if (size === 'large') return '2xl';
    if (size === 'medium') return 'lg';
    return 'md';
  };

  const titleSize = getTitleSize();
  const subtitleSize = size === 'compact' ? 'xs' : 'sm';

  // Only show nav row if there's something to display (back button, inline title, or trailing)
  const showNavRow = back || isInline || trailing;

  return (
    <View
      style={[styles.container, safeArea && { paddingTop: insets.top + 8 }]}
    >
      {showNavRow && (
        <View style={styles.navRow}>
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
              <Typography
                size={titleSize}
                fontWeight="semiBold"
                numberOfLines={1}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography size={subtitleSize} color="gray.textLow">
                  {subtitle}
                </Typography>
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
          <Typography
            size={titleSize}
            fontWeight="bold"
            style={styles.title}
            numberOfLines={2}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              size={subtitleSize}
              color="gray.textLow"
              style={styles.subtitle}
            >
              {subtitle}
            </Typography>
          )}
        </View>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    marginLeft: -theme.spacing.xs,
    justifyContent: 'center',
  },
  navSpacer: {
    flex: 1,
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
  title: {
    lineHeight: 34,
  },
  subtitle: {
    lineHeight: 20,
  },
}));
