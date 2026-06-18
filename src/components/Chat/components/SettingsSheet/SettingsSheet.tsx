import { useCallback, memo } from 'react';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Text } from '@app/components/ui/Text/Text';
import type { SettingsSheetPreferenceFlags } from '@app/components/Chat/types/chatUiFlags';
import { theme } from '@app/styles/themes';
import {
  ScrollView,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHAT_SETTINGS_SHEET_DETENT } from '../chatSheetLayout';
import { chatSheetSurface } from '../chatSheetSurface';
import { useTranslation } from 'react-i18next';

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
  latency?: number | null;
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
  latency,
  reconnectionAttempts,
  preferenceFlags,
}: SettingsSheetProps) => {
  const { t } = useTranslation(['chat', 'common']);
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

  const handleToggleDensity = useCallback(() => {
    onToggleChatDensity?.();
    dismissSheet();
  }, [onToggleChatDensity, dismissSheet]);

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
          <SettingsSection title={t('settingsSheet.sectionAppearance')}>
            <SettingsLinkRow
              title={t('settingsSheet.density')}
              icon={{
                icon: 'text.alignleft',
                androidIcon: 'format_align_left',
                color: theme.colorGrey,
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
                color: theme.colorBlue,
              }}
              value={showTimestamps}
              onValueChange={value => onToggleShowTimestamps?.(value)}
            />
            <SettingsToggleRow
              title={t('settingsSheet.highlightOwnMentions')}
              icon={{
                icon: 'at',
                androidIcon: 'alternate_email',
                color: theme.colorPrimary,
              }}
              value={highlightOwnMentions}
              onValueChange={value => onToggleHighlightOwnMentions?.(value)}
            />
            <SettingsToggleRow
              title={t('settingsSheet.inlineReplyContext')}
              icon={{
                icon: 'arrowshape.turn.up.left',
                androidIcon: 'reply',
                color: theme.colorAmber,
              }}
              value={showInlineReplyContext}
              onValueChange={value => onToggleInlineReplyContext?.(value)}
            />
            <SettingsToggleRow
              title={t('settingsSheet.showJumpPill')}
              icon={{
                icon: 'arrow.down.circle',
                androidIcon: 'arrow_circle_down',
                color: theme.colorGrey,
              }}
              value={showUnreadJumpPill}
              onValueChange={value => onToggleShowUnreadJumpPill?.(value)}
            />
          </SettingsSection>

          {hasActions ? (
            <SettingsSection title={t('settingsSheet.sectionActions')}>
              {onOpenChatters ? (
                <SettingsLinkRow
                  title={t('settingsSheet.viewChatters')}
                  icon={{
                    icon: 'person.2',
                    androidIcon: 'group',
                    color: theme.colorBlue,
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
                    color: theme.colorPrimary,
                  }}
                  onPress={handleRefetchEmotes}
                />
              ) : null}
            </SettingsSection>
          ) : null}

          <SettingsSection title={t('settingsSheet.sectionConnection')}>
            {onReconnect ? (
              <SettingsLinkRow
                title={t('settingsSheet.reconnect')}
                icon={{
                  icon: 'wifi',
                  androidIcon: 'wifi',
                  color: theme.colorPrimary,
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
                  color: theme.colorBlue,
                }}
                onPress={handleRefreshVideo}
              />
            ) : null}
            <SettingsLinkRow
              title={t('settingsSheet.displayLatency')}
              icon={{
                icon: 'waveform.path.ecg',
                androidIcon: 'monitoring',
                color: theme.colorGrey,
              }}
              value={
                latency !== null && latency !== undefined
                  ? `${latency}ms`
                  : t('common:notAvailable')
              }
            />
            <SettingsLinkRow
              title={t('settingsSheet.reconnectionAttempts')}
              icon={{
                icon: 'repeat',
                androidIcon: 'repeat',
                color: theme.colorGrey,
              }}
              value={String(reconnectionAttempts ?? 0)}
            />
          </SettingsSection>

          {hasStorage ? (
            <SettingsSection title={t('settingsSheet.sectionStorage')}>
              {onClearChatCache ? (
                <SettingsLinkRow
                  title={t('settingsSheet.clearChatCache')}
                  icon={{
                    icon: 'cylinder',
                    androidIcon: 'database',
                    color: theme.colorRed,
                  }}
                  onPress={handleClearChatCache}
                />
              ) : null}
              {onClearImageCache ? (
                <SettingsLinkRow
                  title={t('settingsSheet.clearImageCache')}
                  icon={{
                    icon: 'trash',
                    androidIcon: 'delete',
                    color: theme.colorRed,
                  }}
                  onPress={handleClearImageCache}
                />
              ) : null}
              {onClearSevenTvCosmeticsCache ? (
                <SettingsLinkRow
                  title={t('settingsSheet.clearSevenTvCosmeticCache')}
                  icon={{
                    icon: 'sparkles',
                    androidIcon: 'auto_awesome',
                    color: theme.colorRed,
                  }}
                  onPress={handleClearSevenTvCosmeticsCache}
                />
              ) : null}
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
    paddingHorizontal: theme.space20,
    paddingTop: theme.space4,
    paddingBottom: theme.space12,
  },
  headerTitle: {
    fontSize: theme.fontSize20,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
});
