import { useCallback, memo } from 'react';
import { Button } from '@app/components/Button/Button';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/ui/Text/Text';
import type { SettingsSheetPreferenceFlags } from '@app/components/Chat/types/chatUiFlags';
import { theme } from '@app/styles/themes';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  ScrollView,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHAT_SETTINGS_SHEET_DETENT } from '../chatSheetLayout';
import { CHAT_SHEET_BACKGROUND, chatSheetSurface } from '../chatSheetSurface';

function ToggleMenuItemComponent({
  icon,
  label,
  onValueChange,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  onValueChange?: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.menuItem}>
      <SymbolView name={icon} tintColor={theme.colorBorderHover} />
      <View style={styles.menuItemTextContainer}>
        <Text style={styles.menuItemText} weight='semibold'>
          {label}
        </Text>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onValueChange}
        />
      </View>
    </View>
  );
}

const ToggleMenuItem = ToggleMenuItemComponent;

export interface SettingsSheetProps {
  isPresented: boolean;
  preferenceFlags?: SettingsSheetPreferenceFlags;
  onClearChatCache?: () => void;
  onClearImageCache?: () => void;
  onClearSevenTvCosmeticsCache?: () => void;
  onDismiss: () => void;
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
}

const SettingsSheetComponent = ({
  isPresented,
  onDismiss,
  onRefetchEmotes,
  onClearChatCache,
  onClearImageCache,
  onClearSevenTvCosmeticsCache,
  onReconnect,
  onRefreshVideo,
  onToggleChatDensity,
  onToggleHighlightOwnMentions,
  onToggleInlineReplyContext,
  onToggleShowTimestamps,
  onToggleShowUnreadJumpPill,
  latency,
  reconnectionAttempts,
  preferenceFlags,
}: SettingsSheetProps) => {
  const {
    chatDensity = 'comfortable',
    highlightOwnMentions = true,
    showInlineReplyContext = true,
    showTimestamps = true,
    showUnreadJumpPill = true,
  } = preferenceFlags ?? {};
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * CHAT_SETTINGS_SHEET_DETENT);

  const dismissSheet = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const handleRefetchEmotes = useCallback(() => {
    onRefetchEmotes?.();
    dismissSheet();
  }, [onRefetchEmotes, dismissSheet]);

  const handleClearChatCache = useCallback(() => {
    onClearChatCache?.();
    dismissSheet();
  }, [onClearChatCache, dismissSheet]);

  const handleClearImageCache = useCallback(() => {
    onClearImageCache?.();
    dismissSheet();
  }, [onClearImageCache, dismissSheet]);

  const handleClearSevenTvCosmeticsCache = useCallback(() => {
    onClearSevenTvCosmeticsCache?.();
    dismissSheet();
  }, [onClearSevenTvCosmeticsCache, dismissSheet]);

  const handleReconnect = useCallback(() => {
    onReconnect?.();
    dismissSheet();
  }, [onReconnect, dismissSheet]);

  const handleRefreshVideo = useCallback(() => {
    onRefreshVideo?.();
    dismissSheet();
  }, [onRefreshVideo, dismissSheet]);

  return (
    <BottomSheet
      enableFixedSnapPoints
      isPresented={isPresented}
      onDismiss={onDismiss}
      showDragIndicator
      snapPoints={[{ fraction: CHAT_SETTINGS_SHEET_DETENT }]}
      testID='chat-settings-sheet'
    >
      <View style={[styles.container, { height: sheetHeight }]}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow} weight='semibold'>
            CHAT
          </Text>
          <Text style={styles.headerTitle} weight='semibold'>
            Settings
          </Text>
        </View>

        <ScrollView
          style={styles.menuScroll}
          contentContainerStyle={[
            styles.menuContainer,
            { paddingBottom: bottomInset + theme.space20 },
          ]}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {onRefetchEmotes ? (
            <Button
              label='Refetch Emotes and Badges'
              style={styles.menuItem}
              onPress={handleRefetchEmotes}
            >
              <SymbolView
                name='arrow.clockwise'
                tintColor={theme.colorBorderHover}
              />
              <Text style={styles.menuItemText} weight='semibold'>
                Refetch Emotes & Badges
              </Text>
            </Button>
          ) : null}

          <Button
            label='Toggle Chat Density'
            style={styles.menuItem}
            onPress={() => {
              onToggleChatDensity?.();
              dismissSheet();
            }}
          >
            <SymbolView
              name='text.alignleft'
              tintColor={theme.colorBorderHover}
            />
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemText} weight='semibold'>
                Density
              </Text>
              <Text style={styles.menuItemValue} weight='bold'>
                {chatDensity === 'compact' ? 'Compact' : 'Comfortable'}
              </Text>
            </View>
          </Button>

          <ToggleMenuItem
            icon='clock'
            label='Show Timestamps'
            value={showTimestamps}
            onValueChange={onToggleShowTimestamps}
          />

          <ToggleMenuItem
            icon='at'
            label='Highlight Own Mentions'
            value={highlightOwnMentions}
            onValueChange={onToggleHighlightOwnMentions}
          />

          <ToggleMenuItem
            icon='arrowshape.turn.up.left'
            label='Inline Reply Context'
            value={showInlineReplyContext}
            onValueChange={onToggleInlineReplyContext}
          />

          <ToggleMenuItem
            icon='arrow.down.circle'
            label='Show Jump Pill'
            value={showUnreadJumpPill}
            onValueChange={onToggleShowUnreadJumpPill}
          />

          {onReconnect ? (
            <Button
              label='Reconnect'
              style={styles.menuItem}
              onPress={handleReconnect}
            >
              <SymbolView name='wifi' tintColor={theme.colorBorderHover} />
              <Text style={styles.menuItemText} weight='semibold'>
                Reconnect
              </Text>
            </Button>
          ) : null}

          {onClearChatCache ? (
            <Button
              label='Clear Chat Cache'
              style={styles.menuItem}
              onPress={handleClearChatCache}
            >
              <SymbolView name='cylinder' tintColor={theme.colorBorderHover} />
              <Text style={styles.menuItemText} weight='semibold'>
                Clear Chat Cache
              </Text>
            </Button>
          ) : null}

          {onClearImageCache ? (
            <Button
              label='Clear Image Cache'
              style={styles.menuItem}
              onPress={handleClearImageCache}
            >
              <SymbolView name='trash' tintColor={theme.colorBorderHover} />
              <Text style={styles.menuItemText} weight='semibold'>
                Clear Image Cache
              </Text>
            </Button>
          ) : null}

          {onClearSevenTvCosmeticsCache ? (
            <Button
              label='Clear 7TV Cosmetic Cache'
              style={styles.menuItem}
              onPress={handleClearSevenTvCosmeticsCache}
            >
              <SymbolView name='sparkles' tintColor={theme.colorBorderHover} />
              <Text style={styles.menuItemText} weight='semibold'>
                Clear 7TV Cosmetic Cache
              </Text>
            </Button>
          ) : null}

          <View style={styles.menuItem}>
            <SymbolView
              name='waveform.path.ecg'
              tintColor={theme.colorBorderHover}
            />
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemText} weight='semibold'>
                Display Latency
              </Text>
              <Text style={styles.menuItemValue} weight='bold'>
                {latency !== null && latency !== undefined
                  ? `${latency}ms`
                  : 'N/A'}
              </Text>
            </View>
          </View>

          {onRefreshVideo ? (
            <Button
              label='Refresh Video'
              style={styles.menuItem}
              onPress={handleRefreshVideo}
            >
              <SymbolView name='video' tintColor={theme.colorBorderHover} />
              <Text style={styles.menuItemText} weight='semibold'>
                Refresh Video
              </Text>
            </Button>
          ) : null}

          <View style={styles.menuItem}>
            <SymbolView name='repeat' tintColor={theme.colorBorderHover} />
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuItemText} weight='semibold'>
                Reconnection Attempts
              </Text>
              <Text style={styles.menuItemValue} weight='bold'>
                {reconnectionAttempts ?? 0}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export const SettingsSheet = memo(SettingsSheetComponent);

const styles = StyleSheet.create({
  container: {
    ...chatSheetSurface,
    alignSelf: 'stretch',
    backgroundColor: CHAT_SHEET_BACKGROUND,
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
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
    minHeight: 0,
  },
});
