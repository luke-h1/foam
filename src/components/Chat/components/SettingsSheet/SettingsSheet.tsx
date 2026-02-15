import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Text } from '@app/components/Text/Text';
import { TrueSheet, TrueSheetProps } from '@lodev09/react-native-true-sheet';
import { memo, useCallback, forwardRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export interface SettingsSheetProps
  extends Omit<TrueSheetProps, 'children' | 'sizes'> {
  onRefetchEmotes?: () => void;
  onReconnect?: () => void;
  onRefreshVideo?: () => void;
  latency?: number | null;
  reconnectionAttempts?: number;
}

const SettingsSheetComponent = forwardRef<TrueSheet, SettingsSheetProps>(
  (
    {
      onRefetchEmotes,
      onReconnect,
      onRefreshVideo,
      latency,
      reconnectionAttempts,
      ...sheetProps
    },
    forwardedRef,
  ) => {
    const { bottom: bottomInset } = useSafeAreaInsets();
    const { theme } = useUnistyles();

    const dismissSheet = useCallback(() => {
      if (
        forwardedRef &&
        typeof forwardedRef !== 'function' &&
        forwardedRef.current
      ) {
        void forwardedRef.current.dismiss();
      }
    }, [forwardedRef]);

    const handleRefetchEmotes = useCallback(() => {
      onRefetchEmotes?.();
      dismissSheet();
    }, [onRefetchEmotes, dismissSheet]);

    const handleReconnect = useCallback(() => {
      onReconnect?.();
      dismissSheet();
    }, [onReconnect, dismissSheet]);

    const handleRefreshVideo = useCallback(() => {
      onRefreshVideo?.();
      dismissSheet();
    }, [onRefreshVideo, dismissSheet]);

    return (
      <TrueSheet
        ref={forwardedRef}
        detents={[0.4]}
        cornerRadius={24}
        grabber={false}
        blurTint="dark"
        backgroundColor="#1a1a1a"
        {...sheetProps}
      >
        <View style={[styles.container, { paddingBottom: bottomInset + 16 }]}>
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle} weight="semibold">
              Settings
            </Text>
          </View>

          <View style={styles.menuContainer}>
            <Button style={styles.menuItem} onPress={handleRefetchEmotes}>
              <Icon icon="refresh-cw" color={theme.colors.gray.borderHover} />
              <Text style={styles.menuItemText} weight="semibold">
                Refetch Emotes & Badges
              </Text>
            </Button>

            <Button style={styles.menuItem} onPress={handleReconnect}>
              <Icon icon="wifi" color={theme.colors.gray.borderHover} />
              <Text style={styles.menuItemText} weight="semibold">
                Reconnect
              </Text>
            </Button>

            <View style={styles.menuItem}>
              <Icon icon="activity" color={theme.colors.gray.borderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Display Latency
                </Text>
                <Text style={styles.menuItemValue} weight="bold">
                  {latency !== null && latency !== undefined
                    ? `${latency}ms`
                    : 'N/A'}
                </Text>
              </View>
            </View>

            <Button style={styles.menuItem} onPress={handleRefreshVideo}>
              <Icon icon="video" color={theme.colors.gray.borderHover} />
              <Text style={styles.menuItemText} weight="semibold">
                Refresh Video
              </Text>
            </Button>

            <View style={styles.menuItem}>
              <Icon icon="repeat" color={theme.colors.gray.borderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Reconnection Attempts
                </Text>
                <Text style={styles.menuItemValue} weight="bold">
                  {reconnectionAttempts ?? 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TrueSheet>
    );
  },
);

SettingsSheetComponent.displayName = 'SettingsSheet';

export const SettingsSheet = memo(SettingsSheetComponent);

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray.accent,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.font.fontSize.lg,
  },
  menuContainer: {
    paddingTop: theme.spacing.xs,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    minHeight: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.radii.md,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: theme.font.fontSize.md,
    flex: 1,
  },
  menuItemValue: {
    fontSize: theme.font.fontSize.md,
    color: theme.colors.gray.text,
  },
}));
