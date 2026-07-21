import { memo, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomSheet,
  type BottomSheetHandle,
} from '@app/components/BottomSheet/BottomSheet';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferences/selectors';
import { requestLiveSync } from '@app/store/stream/liveSyncBus';
import { theme } from '@app/styles/themes';

import { CHAT_SETTINGS_SHEET_DETENT } from '../chatSheetLayout';

export interface SettingsSheetProps {
  isPresented: boolean;
  onClearChatCache?: () => void;
  onClearImageCache?: () => void;
  onClearSevenTvCosmeticsCache?: () => void;
  onDismiss: () => void;
  onOpenChatters?: () => void;
  onOpenSavedPhrases?: () => void;
  onRefetchEmotes?: () => void;
  onReconnect?: () => void;
}

const SettingsSheetComponent = ({
  isPresented,
  onDismiss,
  onOpenChatters,
  onOpenSavedPhrases,
  onRefetchEmotes,
  onClearChatCache,
  onClearImageCache,
  onClearSevenTvCosmeticsCache,
  onReconnect,
}: SettingsSheetProps) => {
  const { t } = useTranslation(['chat', 'common']);
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  const iconTint = theme.color.textSecondary[scheme];
  const sectionCardColor = theme.color.surfaceNeutral[scheme];
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
    onOpenChatters || onOpenSavedPhrases || onRefetchEmotes,
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
        <View
          style={[
            styles.header,
            { borderBottomColor: theme.color.border[scheme] },
          ]}
        >
          <Text style={styles.headerTitle} weight='semibold'>
            {t('settingsSheet.title')}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomInset + theme.space24 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <SettingsSection
            title={t('settingsSheet.sectionAppearance')}
            cardColor={sectionCardColor}
          >
            <SettingsLinkRow
              title={t('settingsSheet.density')}
              icon={{
                icon: 'text.alignleft',
                androidIcon: 'format_align_left',
                color: iconTint,
              }}
              value={
                chatDensity === 'compact'
                  ? t('settingsSheet.compact')
                  : t('settingsSheet.comfortable')
              }
              onPress={handleToggleDensity}
            />
            <SettingsToggleRow
              title={t('settingsSheet.showTimestamps')}
              icon={{
                icon: 'clock',
                androidIcon: 'schedule',
                color: iconTint,
              }}
              value={showTimestamps}
              onValueChange={value =>
                updatePreferences({ chatTimestamps: value })
              }
            />
            <SettingsToggleRow
              title={t('settingsSheet.highlightOwnMentions')}
              icon={{
                icon: 'at',
                androidIcon: 'alternate_email',
                color: iconTint,
              }}
              value={highlightOwnMentions}
              onValueChange={value =>
                updatePreferences({ highlightOwnMentions: value })
              }
            />
            <SettingsToggleRow
              title={t('settingsSheet.inlineReplyContext')}
              icon={{
                icon: 'arrowshape.turn.up.left',
                androidIcon: 'reply',
                color: iconTint,
              }}
              value={showInlineReplyContext}
              onValueChange={value =>
                updatePreferences({ showInlineReplyContext: value })
              }
            />
            <SettingsToggleRow
              title={t('settingsSheet.showJumpPill')}
              icon={{
                icon: 'arrow.down.circle',
                androidIcon: 'arrow_circle_down',
                color: iconTint,
              }}
              value={showUnreadJumpPill}
              onValueChange={value =>
                updatePreferences({ showUnreadJumpPill: value })
              }
            />
            <SettingsToggleRow
              title={t('settingsSheet.showJoinPartMessages')}
              icon={{
                icon: 'person.badge.plus',
                androidIcon: 'group_add',
                color: iconTint,
              }}
              value={showJoinPartMessages}
              onValueChange={value =>
                updatePreferences({ showJoinPartMessages: value })
              }
            />
          </SettingsSection>

          {hasActions ? (
            <SettingsSection
              title={t('settingsSheet.sectionActions')}
              cardColor={sectionCardColor}
            >
              {onOpenChatters ? (
                <SettingsLinkRow
                  title={t('settingsSheet.viewChatters')}
                  icon={{
                    icon: 'person.2',
                    androidIcon: 'group',
                    color: iconTint,
                  }}
                  onPress={onOpenChatters}
                />
              ) : null}
              {onOpenSavedPhrases ? (
                <SettingsLinkRow
                  title={t('settingsSheet.savedPhrases')}
                  icon={{
                    icon: 'text.bubble',
                    androidIcon: 'chat_bubble',
                    color: iconTint,
                  }}
                  onPress={handleOpenSavedPhrases}
                />
              ) : null}
              {onRefetchEmotes ? (
                <SettingsLinkRow
                  title={t('settingsSheet.refetchEmotes')}
                  icon={{
                    icon: 'arrow.clockwise',
                    androidIcon: 'refresh',
                    color: iconTint,
                  }}
                  onPress={handleRefetchEmotes}
                />
              ) : null}
            </SettingsSection>
          ) : null}

          <SettingsSection
            title={t('settingsSheet.sectionConnection')}
            cardColor={sectionCardColor}
          >
            <SettingsLinkRow
              title={t('settingsSheet.syncToLive')}
              subtitle={t('settingsSheet.syncToLiveSubtitle')}
              icon={{
                icon: 'forward.end.fill',
                androidIcon: 'skip_next',
                color: iconTint,
              }}
              onPress={handleSyncToLive}
            />
            {onReconnect ? (
              <SettingsLinkRow
                title={t('settingsSheet.reconnect')}
                icon={{
                  icon: 'wifi',
                  androidIcon: 'wifi',
                  color: iconTint,
                }}
                onPress={handleReconnect}
              />
            ) : null}
          </SettingsSection>

          {hasStorage ? (
            <SettingsSection
              title={t('settingsSheet.sectionStorage')}
              cardColor={sectionCardColor}
            >
              <SettingsLinkRow
                title={t('settingsSheet.clearCache')}
                icon={{
                  icon: 'trash',
                  androidIcon: 'delete',
                  color: theme.color.danger[scheme],
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
