import { memo, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatSheet } from '@app/components/chat/components/sheet/ChatSheet';
import { useChatSheet } from '@app/components/chat/components/sheet/hooks/use-chat-sheet';
import { SheetHeader } from '@app/components/chat/components/sheet/SheetHeader';
import {
  CHAT_SETTINGS_SHEET_DETENT,
  type ChatSheetLayout,
} from '@app/components/chat/components/sheet/util/chatSheetLayout';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/settings-section/SettingsSection';
import {
  CONTEXT_TOGGLE_ROWS,
  DENSITY_OPTIONS,
} from '@app/constants/chat-preferences';
import { updatePreferences, usePreference } from '@app/store/preference-store';
import { requestLiveSync } from '@app/store/stream/live-sync-bus';
import { theme } from '@app/styles/themes';

export interface SettingsSheetProps {
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

function ContextToggleRow({
  row,
}: {
  row: (typeof CONTEXT_TOGGLE_ROWS)[number];
}) {
  const value = usePreference(row.key);

  return (
    <SettingsToggleRow
      title={row.label}
      icon={row}
      value={value}
      onValueChange={next => updatePreferences({ [row.key]: next })}
    />
  );
}

const SHEET_LAYOUT: ChatSheetLayout = {
  fraction: CHAT_SETTINGS_SHEET_DETENT,
  kind: 'fraction',
};

const SettingsSheetComponent = ({
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
  const showJoinPartMessages = usePreference('showJoinPartMessages');
  const {
    bottom: bottomInset,
    left: leftInset,
    right: rightInset,
  } = useSafeAreaInsets();
  const { requestClose, runAndClose, sheetRef } = useChatSheet();

  const handleToggleDensity = () =>
    runAndClose(() =>
      updatePreferences({
        chatDensity: chatDensity === 'compact' ? 'comfortable' : 'compact',
      }),
    );

  const handleOpenSavedPhrases = useCallback(() => {
    requestClose();
    onOpenSavedPhrases?.();
  }, [requestClose, onOpenSavedPhrases]);

  const handleClearCache = () =>
    runAndClose(() => {
      onClearChatCache?.();
      onClearImageCache?.();
      onClearSevenTvCosmeticsCache?.();
    });

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
    <ChatSheet
      ref={sheetRef}
      onDismiss={onDismiss}
      layout={SHEET_LAYOUT}
      testID='chat-settings-sheet-modal'
    >
      <View style={styles.container} testID='chat-settings-sheet'>
        <View style={styles.header}>
          <SheetHeader title='Chat' onClose={requestClose} />
        </View>

        <ScrollView
          nestedScrollEnabled
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: bottomInset + theme.space24,
              ...(leftInset > 0 || rightInset > 0
                ? {
                    paddingLeft: theme.space16 + leftInset,
                    paddingRight: theme.space16 + rightInset,
                  }
                : null),
            },
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
                  icon={{ icon: 'magnifyingglass' }}
                  onPress={onOpenMessageSearch}
                />
              ) : null}
              {onOpenChatters ? (
                <SettingsLinkRow
                  title='View chatters'
                  icon={{ icon: 'person.2' }}
                  onPress={onOpenChatters}
                />
              ) : null}
              {onOpenSavedPhrases ? (
                <SettingsLinkRow
                  title='Saved phrases'
                  icon={{ icon: 'text.bubble' }}
                  onPress={handleOpenSavedPhrases}
                />
              ) : null}
              {onRefetchEmotes ? (
                <SettingsLinkRow
                  title='Reload emotes and badges'
                  icon={{ icon: 'arrow.clockwise' }}
                  onPress={() => runAndClose(onRefetchEmotes)}
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
              icon={{ icon: 'text.alignleft' }}
              value={
                DENSITY_OPTIONS.find(option => option.value === chatDensity)
                  ?.label
              }
              onPress={handleToggleDensity}
            />
            {CONTEXT_TOGGLE_ROWS.map(row => (
              <ContextToggleRow key={row.key} row={row} />
            ))}
            <SettingsToggleRow
              title='Show joins and parts'
              icon={{ icon: 'person.badge.plus' }}
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
              subtitle='Jump to the live edge'
              icon={{ icon: 'forward.end.fill' }}
              onPress={() => runAndClose(requestLiveSync)}
            />
            {onReconnect ? (
              <SettingsLinkRow
                title='Reconnect'
                icon={{ icon: 'wifi' }}
                onPress={() => runAndClose(onReconnect)}
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
                icon={{ icon: 'trash' }}
                onPress={handleClearCache}
                danger
              />
            </SettingsSection>
          ) : null}
        </ScrollView>
      </View>
    </ChatSheet>
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
