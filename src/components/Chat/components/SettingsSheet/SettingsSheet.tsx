import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { TrueSheet, TrueSheetProps } from '@lodev09/react-native-true-sheet';
import { memo, useCallback, forwardRef } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface SettingsSheetProps extends Omit<
  TrueSheetProps,
  'children' | 'sizes'
> {
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
        detents={[0.58]}
        cornerRadius={24}
        grabber={false}
        blurTint="dark"
        backgroundColor={theme.color.background.dark}
        {...sheetProps}
      >
        <View style={styles.container}>
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerEyebrow} weight="semibold">
              CHAT
            </Text>
            <Text style={styles.headerTitle} weight="semibold">
              Settings
            </Text>
          </View>

          <ScrollView
            style={styles.menuScroll}
            contentContainerStyle={[
              styles.menuContainer,
              { paddingBottom: bottomInset + theme.space20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {onRefetchEmotes ? (
              <Button
                label="Refetch Emotes and Badges"
                style={styles.menuItem}
                onPress={handleRefetchEmotes}
              >
                <Icon icon="refresh-cw" color={theme.colorBorderHover} />
                <Text style={styles.menuItemText} weight="semibold">
                  Refetch Emotes & Badges
                </Text>
              </Button>
            ) : null}

            <Button
              label="Toggle Chat Density"
              style={styles.menuItem}
              onPress={() => {
                onToggleChatDensity?.();
                dismissSheet();
              }}
            >
              <Icon icon="align-left" color={theme.colorBorderHover} />
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
              <Icon icon="clock" color={theme.colorBorderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Show Timestamps
                </Text>
                <Switch
                  value={showTimestamps}
                  onValueChange={value => onToggleShowTimestamps?.(value)}
                />
              </View>
            </View>

            <View style={styles.menuItem}>
              <Icon icon="at-sign" color={theme.colorBorderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Highlight Own Mentions
                </Text>
                <Switch
                  value={highlightOwnMentions}
                  onValueChange={value => onToggleHighlightOwnMentions?.(value)}
                />
              </View>
            </View>

            <View style={styles.menuItem}>
              <Icon icon="corner-up-left" color={theme.colorBorderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Inline Reply Context
                </Text>
                <Switch
                  value={showInlineReplyContext}
                  onValueChange={value => onToggleInlineReplyContext?.(value)}
                />
              </View>
            </View>

            <View style={styles.menuItem}>
              <Icon icon="arrow-down-circle" color={theme.colorBorderHover} />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText} weight="semibold">
                  Show Jump Pill
                </Text>
                <Switch
                  value={showUnreadJumpPill}
                  onValueChange={value => onToggleShowUnreadJumpPill?.(value)}
                />
              </View>
            </View>

            {onReconnect ? (
              <Button
                label="Reconnect"
                style={styles.menuItem}
                onPress={handleReconnect}
              >
                <Icon icon="wifi" color={theme.colorBorderHover} />
                <Text style={styles.menuItemText} weight="semibold">
                  Reconnect
                </Text>
              </Button>
            ) : null}

            <View style={styles.menuItem}>
              <Icon icon="activity" color={theme.colorBorderHover} />
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

            {onRefreshVideo ? (
              <Button
                label="Refresh Video"
                style={styles.menuItem}
                onPress={handleRefreshVideo}
              >
                <Icon icon="video" color={theme.colorBorderHover} />
                <Text style={styles.menuItemText} weight="semibold">
                  Refresh Video
                </Text>
              </Button>
            ) : null}

            <View style={styles.menuItem}>
              <Icon icon="repeat" color={theme.colorBorderHover} />
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
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  grabber: {
    backgroundColor: theme.colorBorderHover,
    borderRadius: 999,
    height: 4,
    width: 44,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingBottom: theme.space8,
    paddingTop: theme.space12,
  },
  header: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: 1,
    marginBottom: theme.space8,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  headerEyebrow: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: theme.fontSize16,
  },
  menuContainer: {
    paddingTop: 0,
  },
  menuItem: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    marginBottom: theme.space8,
    marginHorizontal: theme.space20,
    minHeight: 50,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  menuItemText: {
    flex: 1,
    fontSize: theme.fontSize14,
  },
  menuItemTextContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuItemValue: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize14,
  },
  menuScroll: {
    flex: 1,
  },
});
