import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button as NativeButton,
  Form,
  Host,
  Picker,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';

import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';

export interface SettingsSheetIosFormProps {
  onClearCache?: () => void;
  onOpenChatters?: () => void;
  onOpenMessageSearch?: () => void;
  onOpenSavedPhrases?: () => void;
  onReconnect?: () => void;
  onRefetchEmotes?: () => void;
  onSyncToLive: () => void;
}

export function SettingsSheetIosForm({
  onClearCache,
  onOpenChatters,
  onOpenMessageSearch,
  onOpenSavedPhrases,
  onReconnect,
  onRefetchEmotes,
  onSyncToLive,
}: SettingsSheetIosFormProps) {
  const { t } = useTranslation(['chat', 'common']);
  const chatDensity = usePreference('chatDensity');
  const highlightOwnMentions = usePreference('highlightOwnMentions');
  const showInlineReplyContext = usePreference('showInlineReplyContext');
  const showTimestamps = usePreference('chatTimestamps');
  const showUnreadJumpPill = usePreference('showUnreadJumpPill');
  const showJoinPartMessages = usePreference('showJoinPartMessages');
  const updatePreferences = useUpdatePreferences();

  const hasActions = Boolean(
    onOpenChatters ||
    onOpenMessageSearch ||
    onOpenSavedPhrases ||
    onRefetchEmotes,
  );

  return (
    <Host ignoreSafeArea='all' style={styles.host}>
      <Form>
        <Section title={t('settingsSheet.sectionAppearance')}>
          <Picker
            label={t('settingsSheet.density')}
            systemImage='text.alignleft'
            selection={chatDensity}
            onSelectionChange={value =>
              updatePreferences({ chatDensity: value })
            }
          >
            <NativeText modifiers={[tag('comfortable')]}>
              {t('settingsSheet.comfortable')}
            </NativeText>
            <NativeText modifiers={[tag('compact')]}>
              {t('settingsSheet.compact')}
            </NativeText>
          </Picker>
          <Toggle
            label={t('settingsSheet.showTimestamps')}
            systemImage='clock'
            isOn={showTimestamps}
            onIsOnChange={value => updatePreferences({ chatTimestamps: value })}
          />
          <Toggle
            label={t('settingsSheet.highlightOwnMentions')}
            systemImage='at'
            isOn={highlightOwnMentions}
            onIsOnChange={value =>
              updatePreferences({ highlightOwnMentions: value })
            }
          />
          <Toggle
            label={t('settingsSheet.inlineReplyContext')}
            systemImage='arrowshape.turn.up.left'
            isOn={showInlineReplyContext}
            onIsOnChange={value =>
              updatePreferences({ showInlineReplyContext: value })
            }
          />
          <Toggle
            label={t('settingsSheet.showJumpPill')}
            systemImage='arrow.down.circle'
            isOn={showUnreadJumpPill}
            onIsOnChange={value =>
              updatePreferences({ showUnreadJumpPill: value })
            }
          />
          <Toggle
            label={t('settingsSheet.showJoinPartMessages')}
            systemImage='person.badge.plus'
            isOn={showJoinPartMessages}
            onIsOnChange={value =>
              updatePreferences({ showJoinPartMessages: value })
            }
          />
        </Section>

        {hasActions ? (
          <Section title={t('settingsSheet.sectionActions')}>
            {onOpenMessageSearch ? (
              <NativeButton
                label={t('settingsSheet.searchMessages')}
                systemImage='magnifyingglass'
                onPress={onOpenMessageSearch}
              />
            ) : null}
            {onOpenChatters ? (
              <NativeButton
                label={t('settingsSheet.viewChatters')}
                systemImage='person.2'
                onPress={onOpenChatters}
              />
            ) : null}
            {onOpenSavedPhrases ? (
              <NativeButton
                label={t('settingsSheet.savedPhrases')}
                systemImage='text.bubble'
                onPress={onOpenSavedPhrases}
              />
            ) : null}
            {onRefetchEmotes ? (
              <NativeButton
                label={t('settingsSheet.refetchEmotes')}
                systemImage='arrow.clockwise'
                onPress={onRefetchEmotes}
              />
            ) : null}
          </Section>
        ) : null}

        <Section
          header={
            <NativeText>{t('settingsSheet.sectionConnection')}</NativeText>
          }
          footer={
            <NativeText>{t('settingsSheet.syncToLiveSubtitle')}</NativeText>
          }
        >
          <NativeButton
            label={t('settingsSheet.syncToLive')}
            systemImage='forward.end.fill'
            onPress={onSyncToLive}
          />
          {onReconnect ? (
            <NativeButton
              label={t('settingsSheet.reconnect')}
              systemImage='wifi'
              onPress={onReconnect}
            />
          ) : null}
        </Section>

        {onClearCache ? (
          <Section title={t('settingsSheet.sectionStorage')}>
            <NativeButton
              label={t('settingsSheet.clearCache')}
              systemImage='trash'
              // eslint-disable-next-line jsx-a11y/aria-role, react-doctor/aria-role -- SwiftUI Button role, not ARIA
              role='destructive'
              onPress={onClearCache}
            />
          </Section>
        ) : null}
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
