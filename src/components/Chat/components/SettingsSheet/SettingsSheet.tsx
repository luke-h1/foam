import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { TrueSheet, TrueSheetProps } from '@lodev09/react-native-true-sheet';
import { memo, useCallback, forwardRef } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface SettingsSheetProps
  extends Omit<TrueSheetProps, 'children' | 'sizes'> {
  chatDensity?: 'comfortable' | 'compact';
  highlightOwnMentions?: boolean;
  onRefetchEmotes?: () => void;
  onReconnect?: () => void;
  onRefreshVideo?: () => void;
  onToggleChatDensity?: () => void;
  onToggleHighlightOwnMentions?: (value: boolean) => void;
  onToggleInlineReplyContext?: (value: boolean) => void;
  onToggleShowTimestamps?: (value: boolean) => void;
  onToggleShowUnreadJumpPill?: (value: boolean) => void;
  latency?: number | null;
  reconnectionAttempts?: number;
  showInlineReplyContext?: boolean;
  showTimestamps?: boolean;
  showUnreadJumpPill?: boolean;
}

const SettingsSheetComponent = forwardRef<TrueSheet, SettingsSheetProps>(
  (
    {
      onRefetchEmotes,
      onReconnect,
      onRefreshVideo,
      onToggleChatDensity,
      onToggleHighlightOwnMentions,
      onToggleInlineReplyContext,
      onToggleShowTimestamps,
      onToggleShowUnreadJumpPill,
      latency,
      reconnectionAttempts,
      chatDensity = 'comfortable',
      highlightOwnMentions = true,
      showInlineReplyContext = true,
      showTimestamps = true,
      showUnreadJumpPill = true,
      ...sheetProps
    },
    forwardedRef,
  ) => {
    const { bottom: bottomInset } = useSafeAreaInsets();

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
        detents={[0.62]}
        cornerRadius={24}
        grabber={false}
        blurTint="dark"
        backgroundColor="#1a1a1a"
        {...sheetProps}
      >
        <View style={styles.container}>
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle} weight="semibold">
              Settings
            </Text>
          </View>

          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={[
              styles.menuContainer,
              { paddingBottom: bottomInset + theme.spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Button style={styles.menuItem} onPress={handleRefetchEmotes}>
              <Icon icon="refresh-cw" color={theme.colors.gray.borderHover} />
              <Text style={styles.menuItemText} weight="semibold">
                Refetch Emotes & Badges
              </Text>
            </Button>

            <Button
              style={styles.menuItem}
              onPress={() => {
                onToggleChatDensity?.();
                dismissSheet();
              }}
            >
              <Icon icon="align-left" color={theme.colors.gray.borderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Density
                </Text>
                <Text style={styles.menuItemValue} weight="bold">
                  {chatDensity === 'compact' ? 'Compact' : 'Comfortable'}
                </Text>
              </View>
            </Button>

            <View style={styles.menuItem}>
              <Icon icon="clock" color={theme.colors.gray.borderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Show Timestamps
                </Text>
                <Switch
                  value={showTimestamps}
                  onValueChange={onToggleShowTimestamps}
                />
              </View>
            </View>

            <View style={styles.menuItem}>
              <Icon icon="at-sign" color={theme.colors.gray.borderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Highlight Own Mentions
                </Text>
                <Switch
                  value={highlightOwnMentions}
                  onValueChange={onToggleHighlightOwnMentions}
                />
              </View>
            </View>

            <View style={styles.menuItem}>
              <Icon
                icon="corner-up-left"
                color={theme.colors.gray.borderHover}
              />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Inline Reply Context
                </Text>
                <Switch
                  value={showInlineReplyContext}
                  onValueChange={onToggleInlineReplyContext}
                />
              </View>
            </View>

            <View style={styles.menuItem}>
              <Icon
                icon="arrow-down-circle"
                color={theme.colors.gray.borderHover}
              />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Show Jump Pill
                </Text>
                <Switch
                  value={showUnreadJumpPill}
                  onValueChange={onToggleShowUnreadJumpPill}
                />
              </View>
            </View>

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
          </ScrollView>
        </View>
      </TrueSheet>
    );
  },
);

SettingsSheetComponent.displayName = 'SettingsSheet';

export const SettingsSheet = memo(SettingsSheetComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grabber: {
    backgroundColor: theme.colors.gray.accent,
    borderRadius: 2,
    height: 4,
    width: 36,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingBottom: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  header: {
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.font.fontSize.lg,
  },
  menuContainer: {
    paddingTop: theme.spacing.xs,
  },
  menuItem: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    marginHorizontal: theme.spacing.md,
    minHeight: theme.spacing['6xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuItemText: {
    flex: 1,
    fontSize: theme.font.fontSize.md,
  },
  menuItemTextContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuItemValue: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.md,
  },
  menuScroll: {
    flex: 1,
  },
});
