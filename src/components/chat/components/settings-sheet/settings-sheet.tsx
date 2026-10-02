import { memo, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/bottom-sheet/bottom-sheet';
import { SheetHeader } from '@app/components/chat/components/sheet/sheet-header';
import { CHAT_SETTINGS_SHEET_DETENT } from '@app/components/chat/util/chat-sheet-layout';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/settings-section';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preference-store';
import { requestLiveSync } from '@app/store/stream/live-sync-bus';
import { theme } from '@app/styles/themes';

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
          <SheetHeader title='Chat' onClose={dismissSheet} />
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
          {hasActions ? (
            <SettingsSection
              title='Actions'
              cardColor={theme.color.surfaceElevated.dark}
            >
              {onOpenMessageSearch ? (
                <SettingsLinkRow
                  title='Search messages'
                  icon={{
                    icon: 'magnifyingglass',
                    androidIcon: 'search',
                  }}
                  onPress={onOpenMessageSearch}
                />
              ) : null}
              {onOpenChatters ? (
                <SettingsLinkRow
                  title='View chatters'
                  icon={{
                    icon: 'person.2',
                    androidIcon: 'group',
                  }}
                  onPress={onOpenChatters}
                />
              ) : null}
              {onOpenSavedPhrases ? (
                <SettingsLinkRow
                  title='Saved phrases'
                  icon={{
                    icon: 'text.bubble',
                    androidIcon: 'chat_bubble',
                  }}
                  onPress={handleOpenSavedPhrases}
                />
              ) : null}
              {onRefetchEmotes ? (
                <SettingsLinkRow
                  title='Reload emotes and badges'
                  icon={{
                    icon: 'arrow.clockwise',
                    androidIcon: 'refresh',
                  }}
                  onPress={handleRefetchEmotes}
                />
              ) : null}
            </SettingsSection>
          ) : null}

          <SettingsSection
            title='Appearance'
            cardColor={theme.color.surfaceElevated.dark}
          >
            <SettingsLinkRow
              title='Density'
              icon={{
                icon: 'text.alignleft',
                androidIcon: 'format_align_left',
              }}
              value={chatDensity === 'compact' ? 'Compact' : 'Comfortable'}
              onPress={handleToggleDensity}
            />
            <SettingsToggleRow
              title='Show timestamps'
              icon={{
                icon: 'clock',
                androidIcon: 'schedule',
              }}
              value={showTimestamps}
              onValueChange={value =>
                updatePreferences({ chatTimestamps: value })
              }
            />
            <SettingsToggleRow
              title='Highlight own mentions'
              icon={{
                icon: 'at',
                androidIcon: 'alternate_email',
              }}
              value={highlightOwnMentions}
              onValueChange={value =>
                updatePreferences({ highlightOwnMentions: value })
              }
            />
            <SettingsToggleRow
              title='Inline reply context'
              icon={{
                icon: 'arrowshape.turn.up.left',
                androidIcon: 'reply',
              }}
              value={showInlineReplyContext}
              onValueChange={value =>
                updatePreferences({ showInlineReplyContext: value })
              }
            />
            <SettingsToggleRow
              title='Show jump pill'
              icon={{
                icon: 'arrow.down.circle',
                androidIcon: 'arrow_circle_down',
              }}
              value={showUnreadJumpPill}
              onValueChange={value =>
                updatePreferences({ showUnreadJumpPill: value })
              }
            />
            <SettingsToggleRow
              title='Show joins and parts'
              icon={{
                icon: 'person.badge.plus',
                androidIcon: 'group_add',
              }}
              value={showJoinPartMessages}
              onValueChange={value =>
                updatePreferences({ showJoinPartMessages: value })
              }
            />
          </SettingsSection>

          <SettingsSection
            title='Connection'
            cardColor={theme.color.surfaceElevated.dark}
          >
            <SettingsLinkRow
              title='Sync to live'
              subtitle='Jump back to the live edge'
              icon={{
                icon: 'forward.end.fill',
                androidIcon: 'skip_next',
              }}
              onPress={handleSyncToLive}
            />
            {onReconnect ? (
              <SettingsLinkRow
                title='Reconnect'
                icon={{
                  icon: 'wifi',
                  androidIcon: 'wifi',
                }}
                onPress={handleReconnect}
              />
            ) : null}
          </SettingsSection>

          {hasStorage ? (
            <SettingsSection
              title='Storage'
              cardColor={theme.color.surfaceElevated.dark}
            >
              <SettingsLinkRow
                title='Clear cache'
                icon={{
                  icon: 'trash',
                  androidIcon: 'delete',
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
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
  header: {
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
});
