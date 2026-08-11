import { memo, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/BottomSheet/BottomSheet';
import { CHAT_SETTINGS_SHEET_DETENT } from '@app/components/Chat/util/chatSheetLayout';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { requestLiveSync } from '@app/store/stream/liveSyncBus';
import { theme } from '@app/styles/themes';

const ICON_TINT = theme.color.textSecondary.dark;

export interface SettingsSheetProps {
  isPresented: boolean;
  onClearChatCache?: () => void;
  onClearImageCache?: () => void;
  onClearSevenTvCosmeticsCache?: () => void;
  onDismiss: () => void;
  onOpenChatters?: () => void;
  onOpenMessageSearch?: () => void;
  onOpenSavedPhrases?: () => void;
  onRefetchEmotes?: () => void;
  onReconnect?: () => void;
}

const SettingsSheetComponent = ({
  isPresented,
  onDismiss,
  onOpenChatters,
  onOpenMessageSearch,
  onOpenSavedPhrases,
  onRefetchEmotes,
  onClearChatCache,
  onClearImageCache,
  onClearSevenTvCosmeticsCache,
  onReconnect,
}: SettingsSheetProps) => {
  const chatDensity = usePreference('chatDensity');
  const highlightOwnMentions = usePreference('highlightOwnMentions');
  const showInlineReplyContext = usePreference('showInlineReplyContext');
  const showTimestamps = usePreference('chatTimestamps');
  const showUnreadJumpPill = usePreference('showUnreadJumpPill');
  const showJoinPartMessages = usePreference('showJoinPartMessages');
  const updatePreferences = useUpdatePreferences();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetHandle>(null);

  const dismissSheet = useCallback(() => {
    sheetRef.current?.requestClose();
  }, []);

  const handleToggleDensity = useCallback(() => {
    updatePreferences({
      chatDensity: chatDensity === 'compact' ? 'comfortable' : 'compact',
    });
    dismissSheet();
  }, [chatDensity, dismissSheet, updatePreferences]);

  const handleRefetchEmotes = useCallback(() => {
    onRefetchEmotes?.();
    dismissSheet();
  }, [onRefetchEmotes, dismissSheet]);

  const handleOpenSavedPhrases = useCallback(() => {
    dismissSheet();
    onOpenSavedPhrases?.();
  }, [dismissSheet, onOpenSavedPhrases]);

  const handleClearCache = useCallback(() => {
    onClearChatCache?.();
    onClearImageCache?.();
    onClearSevenTvCosmeticsCache?.();
    dismissSheet();
  }, [
    onClearChatCache,
    onClearImageCache,
    onClearSevenTvCosmeticsCache,
    dismissSheet,
  ]);

  const handleReconnect = useCallback(() => {
    onReconnect?.();
    dismissSheet();
  }, [onReconnect, dismissSheet]);

  const handleSyncToLive = useCallback(() => {
    requestLiveSync();
    dismissSheet();
  }, [dismissSheet]);

  const hasActions = Boolean(
    onOpenChatters ||
    onOpenMessageSearch ||
    onOpenSavedPhrases ||
    onRefetchEmotes,
  );
  const hasStorage = Boolean(
    onClearChatCache || onClearImageCache || onClearSevenTvCosmeticsCache,
  );

  return (
    <BottomSheet
      ref={sheetRef}
      isPresented={isPresented}
      onDismiss={onDismiss}
      showDragIndicator
      enableFixedSnapPoints
      snapPoints={[{ fraction: CHAT_SETTINGS_SHEET_DETENT }]}
      testID='chat-settings-sheet-modal'
    >
      <View style={styles.container} testID='chat-settings-sheet'>
        <View style={styles.header}>
          <Text style={styles.headerTitle} weight='semibold'>
            Settings
          </Text>
        </View>

        <ScrollView
          nestedScrollEnabled
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomInset + theme.space24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SettingsSection
            title='Appearance'
            cardColor={theme.color.surfaceNeutral.dark}
          >
            <SettingsLinkRow
              title='Density'
              icon={{
                icon: 'text.alignleft',
                androidIcon: 'format_align_left',
                color: ICON_TINT,
              }}
              value={chatDensity === 'compact' ? 'Compact' : 'Comfortable'}
              onPress={handleToggleDensity}
            />
            <SettingsToggleRow
              title='Show Timestamps'
              icon={{
                icon: 'clock',
                androidIcon: 'schedule',
                color: ICON_TINT,
              }}
              value={showTimestamps}
              onValueChange={value =>
                updatePreferences({ chatTimestamps: value })
              }
            />
            <SettingsToggleRow
              title='Highlight Own Mentions'
              icon={{
                icon: 'at',
                androidIcon: 'alternate_email',
                color: ICON_TINT,
              }}
              value={highlightOwnMentions}
              onValueChange={value =>
                updatePreferences({ highlightOwnMentions: value })
              }
            />
            <SettingsToggleRow
              title='Inline Reply Context'
              icon={{
                icon: 'arrowshape.turn.up.left',
                androidIcon: 'reply',
                color: ICON_TINT,
              }}
              value={showInlineReplyContext}
              onValueChange={value =>
                updatePreferences({ showInlineReplyContext: value })
              }
            />
            <SettingsToggleRow
              title='Show Jump Pill'
              icon={{
                icon: 'arrow.down.circle',
                androidIcon: 'arrow_circle_down',
                color: ICON_TINT,
              }}
              value={showUnreadJumpPill}
              onValueChange={value =>
                updatePreferences({ showUnreadJumpPill: value })
              }
            />
            <SettingsToggleRow
              title='Show Join/Part Messages'
              icon={{
                icon: 'person.badge.plus',
                androidIcon: 'group_add',
                color: ICON_TINT,
              }}
              value={showJoinPartMessages}
              onValueChange={value =>
                updatePreferences({ showJoinPartMessages: value })
              }
            />
          </SettingsSection>

          {hasActions ? (
            <SettingsSection
              title='Actions'
              cardColor={theme.color.surfaceNeutral.dark}
            >
              {onOpenMessageSearch ? (
                <SettingsLinkRow
                  title='Search messages'
                  icon={{
                    icon: 'magnifyingglass',
                    androidIcon: 'search',
                    color: ICON_TINT,
                  }}
                  onPress={onOpenMessageSearch}
                />
              ) : null}
              {onOpenChatters ? (
                <SettingsLinkRow
                  title='View Chatters'
                  icon={{
                    icon: 'person.2',
                    androidIcon: 'group',
                    color: ICON_TINT,
                  }}
                  onPress={onOpenChatters}
                />
              ) : null}
              {onOpenSavedPhrases ? (
                <SettingsLinkRow
                  title='Saved Phrases'
                  icon={{
                    icon: 'text.bubble',
                    androidIcon: 'chat_bubble',
                    color: ICON_TINT,
                  }}
                  onPress={handleOpenSavedPhrases}
                />
              ) : null}
              {onRefetchEmotes ? (
                <SettingsLinkRow
                  title='Refetch Emotes & Badges'
                  icon={{
                    icon: 'arrow.clockwise',
                    androidIcon: 'refresh',
                    color: ICON_TINT,
                  }}
                  onPress={handleRefetchEmotes}
                />
              ) : null}
            </SettingsSection>
          ) : null}

          <SettingsSection
            title='Connection'
            cardColor={theme.color.surfaceNeutral.dark}
          >
            <SettingsLinkRow
              title='Sync to Live'
              subtitle='Jump back to the live edge'
              icon={{
                icon: 'forward.end.fill',
                androidIcon: 'skip_next',
                color: ICON_TINT,
              }}
              onPress={handleSyncToLive}
            />
            {onReconnect ? (
              <SettingsLinkRow
                title='Reconnect'
                icon={{
                  icon: 'wifi',
                  androidIcon: 'wifi',
                  color: ICON_TINT,
                }}
                onPress={handleReconnect}
              />
            ) : null}
          </SettingsSection>

          {hasStorage ? (
            <SettingsSection
              title='Storage'
              cardColor={theme.color.surfaceNeutral.dark}
            >
              <SettingsLinkRow
                title='Clear Cache'
                icon={{
                  icon: 'trash',
                  androidIcon: 'delete',
                  color: theme.colorRed,
                }}
                onPress={handleClearCache}
                danger
              />
            </SettingsSection>
          ) : null}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export const SettingsSheet = memo(SettingsSheetComponent);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
  },
  content: {
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  header: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: theme.space12,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space4,
  },
  headerTitle: {
    fontSize: theme.fontSize20,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
});
