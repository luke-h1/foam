import { memo,useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import type { SettingsSheetPreferenceFlags } from '@app/components/Chat/types/chatUiFlags';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

import { CHAT_SETTINGS_SHEET_DETENT } from '../chatSheetLayout';
import { chatSheetSurface } from '../chatSheetSurface';

const ICON_TINT = theme.color.textSecondary.dark;

export interface SettingsSheetProps {
  isPresented: boolean;
  preferenceFlags?: SettingsSheetPreferenceFlags;
  onClearChatCache?: () => void;
  onClearImageCache?: () => void;
  onClearSevenTvCosmeticsCache?: () => void;
  onDismiss: () => void;
  onOpenChatters?: () => void;
  onRefetchEmotes?: () => void;
  onReconnect?: () => void;
  onRefreshVideo?: () => void;
  onToggleChatDensity?: () => void;
  onToggleHighlightOwnMentions?: (value: boolean) => void;
  onToggleInlineReplyContext?: (value: boolean) => void;
  onToggleShowTimestamps?: (value: boolean) => void;
  onToggleShowUnreadJumpPill?: (value: boolean) => void;
  reconnectionAttempts?: number;
}

const SettingsSheetComponent = ({
  isPresented,
  onDismiss,
  onOpenChatters,
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
  reconnectionAttempts,
  preferenceFlags,
}: SettingsSheetProps) => {
  const { t } = useTranslation(['chat', 'common']);
  const {
    chatDensity = 'comfortable',
    highlightOwnMentions = true,
    showInlineReplyContext = true,
    showTimestamps = false,
    showUnreadJumpPill = true,
  } = preferenceFlags ?? {};
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * CHAT_SETTINGS_SHEET_DETENT);

  const dismissSheet = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const handleToggleDensity = useCallback(() => {
    onToggleChatDensity?.();
    dismissSheet();
  }, [onToggleChatDensity, dismissSheet]);

  const handleRefetchEmotes = useCallback(() => {
    onRefetchEmotes?.();
    dismissSheet();
  }, [onRefetchEmotes, dismissSheet]);

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

  const handleRefreshVideo = useCallback(() => {
    onRefreshVideo?.();
    dismissSheet();
  }, [onRefreshVideo, dismissSheet]);

  const hasActions = Boolean(onOpenChatters || onRefetchEmotes);
  const hasStorage = Boolean(
    onClearChatCache || onClearImageCache || onClearSevenTvCosmeticsCache,
  );

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
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <SettingsSection
            title={t('settingsSheet.sectionAppearance')}
            cardColor='#1C1C1E'
          >
            <SettingsLinkRow
              title={t('settingsSheet.density')}
              icon={{
                icon: 'text.alignleft',
                androidIcon: 'format_align_left',
                color: ICON_TINT,
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
                color: ICON_TINT,
              }}
              value={showTimestamps}
              onValueChange={value => onToggleShowTimestamps?.(value)}
            />
            <SettingsToggleRow
              title={t('settingsSheet.highlightOwnMentions')}
              icon={{
                icon: 'at',
                androidIcon: 'alternate_email',
                color: ICON_TINT,
              }}
              value={highlightOwnMentions}
              onValueChange={value => onToggleHighlightOwnMentions?.(value)}
            />
            <SettingsToggleRow
              title={t('settingsSheet.inlineReplyContext')}
              icon={{
                icon: 'arrowshape.turn.up.left',
                androidIcon: 'reply',
                color: ICON_TINT,
              }}
              value={showInlineReplyContext}
              onValueChange={value => onToggleInlineReplyContext?.(value)}
            />
            <SettingsToggleRow
              title={t('settingsSheet.showJumpPill')}
              icon={{
                icon: 'arrow.down.circle',
                androidIcon: 'arrow_circle_down',
                color: ICON_TINT,
              }}
              value={showUnreadJumpPill}
              onValueChange={value => onToggleShowUnreadJumpPill?.(value)}
            />
          </SettingsSection>

          {hasActions ? (
            <SettingsSection
              title={t('settingsSheet.sectionActions')}
              cardColor='#1C1C1E'
            >
              {onOpenChatters ? (
                <SettingsLinkRow
                  title={t('settingsSheet.viewChatters')}
                  icon={{
                    icon: 'person.2',
                    androidIcon: 'group',
                    color: ICON_TINT,
                  }}
                  onPress={onOpenChatters}
                />
              ) : null}
              {onRefetchEmotes ? (
                <SettingsLinkRow
                  title={t('settingsSheet.refetchEmotes')}
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
            title={t('settingsSheet.sectionConnection')}
            cardColor='#1C1C1E'
          >
            {onReconnect ? (
              <SettingsLinkRow
                title={t('settingsSheet.reconnect')}
                icon={{
                  icon: 'wifi',
                  androidIcon: 'wifi',
                  color: ICON_TINT,
                }}
                onPress={handleReconnect}
              />
            ) : null}
            {onRefreshVideo ? (
              <SettingsLinkRow
                title={t('settingsSheet.refreshVideo')}
                icon={{
                  icon: 'video',
                  androidIcon: 'videocam',
                  color: ICON_TINT,
                }}
                onPress={handleRefreshVideo}
              />
            ) : null}
            <SettingsLinkRow
              title={t('settingsSheet.reconnectionAttempts')}
              icon={{
                icon: 'repeat',
                androidIcon: 'repeat',
                color: ICON_TINT,
              }}
              value={String(reconnectionAttempts ?? 0)}
            />
          </SettingsSection>

          {hasStorage ? (
            <SettingsSection
              title={t('settingsSheet.sectionStorage')}
              cardColor='#1C1C1E'
            >
              <SettingsLinkRow
                title={t('settingsSheet.clearCache')}
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
    ...chatSheetSurface,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
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
