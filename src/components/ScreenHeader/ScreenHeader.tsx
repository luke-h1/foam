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
  const insets = useSafeAreaInsets();

  const getTitleSize = () => {
    if (size === 'large') return '2xl';
    if (size === 'medium') return 'xl';
    return 'lg';
  };

  const titleSize = getTitleSize();
  const subtitleSize = size === 'compact' ? 'xs' : 'sm';

  return (
    <View
      style={[styles.container, safeArea && { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.navRow}>
        {back && (
          <IconButton icon="arrowLeft" label="goBack" onPress={onBack} />
        )}
        <View style={styles.navSpacer} />
        {trailing}
      </View>

      <View style={styles.titleSection}>
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

      {children}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  navSpacer: {
    flex: 1,
  },
  titleSection: {
    gap: theme.spacing.xs,
  },
  title: {
    lineHeight: 34,
  },
  subtitle: {
    lineHeight: 20,
  },
}));
