import { type ReactElement,useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Form,
  Host,
  Picker,
  RNHostView,
  Section,
  Text as NativeText,
  Toggle,
} from '@expo/ui/swift-ui';
import { tag } from '@expo/ui/swift-ui/modifiers';
import { router } from 'expo-router';

import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import {
  EMOJI_STYLE_OPTIONS,
  getEmojiEmotes,
} from '@app/utils/emoji/emojiEmotes';

import {
  DensityPreview,
  EmojiStylePreview,
  PreviewLabel,
  ProviderPreviewItem,
} from './ChatPreferencePreviewWidgets';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import {
  DELETED_STYLE_OPTIONS,
  DENSITY_OPTIONS,
  EMOJI_PREVIEW_SHORTCODES,
  FONT_SCALE_OPTIONS,
  type PreviewProvider,
  SCROLLBACK_OPTIONS,
  TIMESTAMP_FORMAT_OPTIONS,
} from './chatPreferenceTypes';

function hostPreview(node: ReactElement, padded = true) {
  return (
    <RNHostView matchContents>
      {padded ? <View style={styles.previewRow}>{node}</View> : node}
    </RNHostView>
  );
}

export function ChatPreferenceNativeForm() {
  const { t } = useTranslation('preferences');
  const preferences = usePreferences();
  const { update } = preferences;

  const emojiPreviewEmotes = useMemo(() => {
    const emotes = getEmojiEmotes(preferences.emojiStyle);
    const preview = EMOJI_PREVIEW_SHORTCODES.flatMap(shortcode => {
      const emote = emotes.find(item => item.name === shortcode);
      return emote ? [emote] : [];
    });
    return preview.length > 0 ? preview : emotes.slice(0, 3);
  }, [preferences.emojiStyle]);

  const contextPreview = {
    chatTimestamps: preferences.chatTimestamps,
    highlightOwnMentions: preferences.highlightOwnMentions,
    showInlineReplyContext: preferences.showInlineReplyContext,
    showUnreadJumpPill: preferences.showUnreadJumpPill,
  };

  const providerSections = [
    {
      title: '7TV',
      provider: '7tv' as PreviewProvider,
      emotes: preferences.show7TvEmotes,
      badges: preferences.show7tvBadges,
      onEmotes: (value: boolean) => update({ show7TvEmotes: value }),
      onBadges: (value: boolean) => update({ show7tvBadges: value }),
    },
    {
      title: 'BTTV',
      provider: 'bttv' as PreviewProvider,
      emotes: preferences.showBttvEmotes,
      badges: preferences.showBttvBadges,
      onEmotes: (value: boolean) => update({ showBttvEmotes: value }),
      onBadges: (value: boolean) => update({ showBttvBadges: value }),
    },
    {
      title: 'FFZ',
      provider: 'ffz' as PreviewProvider,
      emotes: preferences.showFFzEmotes,
      badges: preferences.showFFzBadges,
      onEmotes: (value: boolean) => update({ showFFzEmotes: value }),
      onBadges: (value: boolean) => update({ showFFzBadges: value }),
    },
    {
      title: 'Twitch',
      provider: 'twitch' as PreviewProvider,
      emotes: preferences.showTwitchEmotes,
      badges: preferences.showTwitchBadges,
      onEmotes: (value: boolean) => update({ showTwitchEmotes: value }),
      onBadges: (value: boolean) => update({ showTwitchBadges: value }),
    },
  ];

  return (
    <Host style={styles.host}>
      <Form>
        <Section title={t('layout')}>
          <Picker
            label={t('messageDensity')}
            systemImage='list.bullet'
            selection={preferences.chatDensity}
            onSelectionChange={value => update({ chatDensity: value })}
          >
            {DENSITY_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {t(option.labelKey)}
              </NativeText>
            ))}
          </Picker>
          {hostPreview(<DensityPreview density={preferences.chatDensity} />)}
          <Picker
            label={t('fontSize')}
            systemImage='textformat.size'
            selection={preferences.chatFontScale}
            onSelectionChange={value => update({ chatFontScale: value })}
          >
            {FONT_SCALE_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {t(option.labelKey)}
              </NativeText>
            ))}
          </Picker>
          {hostPreview(
            <ChatPreferencePreview
              variant='fontScale'
              value={preferences.chatFontScale}
            />,
          )}
          <Toggle
            label={t('alternatingRows')}
            systemImage='line.3.horizontal'
            isOn={preferences.showAlternatingChatRows}
            onIsOnChange={value => update({ showAlternatingChatRows: value })}
          />
          {hostPreview(
            <ChatPreferencePreview
              variant='alternatingRows'
              value={preferences.showAlternatingChatRows}
            />,
          )}
        </Section>

        <Section title={t('emojiStyle')}>
          <Picker
            label={t('emojiSet')}
            systemImage='face.smiling'
            selection={preferences.emojiStyle}
            onSelectionChange={value => update({ emojiStyle: value })}
          >
            {EMOJI_STYLE_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </NativeText>
            ))}
          </Picker>
          {hostPreview(<EmojiStylePreview emotes={emojiPreviewEmotes} />)}
        </Section>

        <Section title={t('context')}>
          <Toggle
            label={t('historicalRecentMessages')}
            systemImage='clock.arrow.circlepath'
            isOn={preferences.showRecentMessages !== false}
            onIsOnChange={value => update({ showRecentMessages: value })}
          />
          <Toggle
            label={t('showTimestamps')}
            systemImage='clock'
            isOn={preferences.chatTimestamps}
            onIsOnChange={value => update({ chatTimestamps: value })}
          />
          <Toggle
            label={t('highlightOwnMentions')}
            systemImage='at'
            isOn={preferences.highlightOwnMentions}
            onIsOnChange={value => update({ highlightOwnMentions: value })}
          />
          <Toggle
            label={t('inlineReplyContext')}
            systemImage='arrowshape.turn.up.left'
            isOn={preferences.showInlineReplyContext}
            onIsOnChange={value => update({ showInlineReplyContext: value })}
          />
          <Toggle
            label={t('showJumpPill')}
            systemImage='arrow.down.circle'
            isOn={preferences.showUnreadJumpPill}
            onIsOnChange={value => update({ showUnreadJumpPill: value })}
          />
          <Picker
            label={t('timestampFormat')}
            systemImage='clock.badge'
            selection={preferences.chatTimestampFormat}
            onSelectionChange={value => update({ chatTimestampFormat: value })}
          >
            {TIMESTAMP_FORMAT_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {t(option.labelKey)}
              </NativeText>
            ))}
          </Picker>
          {hostPreview(
            <View>
              <PreviewLabel />
              <View style={styles.previewSpacer}>
                <ChatPreferencePreview
                  variant='context'
                  value={contextPreview}
                />
              </View>
            </View>,
          )}
        </Section>

        <Section
          title={t('highlights')}
          footer={<NativeText>{t('highlightsFooter')}</NativeText>}
        >
          <Button
            label={t('highlightedPhrases')}
            systemImage='highlighter'
            onPress={() => router.push('/tabs/settings/chat-highlights')}
          />
          <Toggle
            label={t('mentionFeedback')}
            systemImage='hand.tap'
            isOn={preferences.chatMentionHaptics !== false}
            onIsOnChange={value => update({ chatMentionHaptics: value })}
          />
        </Section>

        <Section title={t('moderation')}>
          <Picker
            label={t('deletedMessages')}
            systemImage='trash.slash'
            selection={preferences.deletedMessageStyle}
            onSelectionChange={value => update({ deletedMessageStyle: value })}
          >
            {DELETED_STYLE_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {t(option.labelKey)}
              </NativeText>
            ))}
          </Picker>
          <Toggle
            label={t('keepHistoryOnClear')}
            systemImage='clock.arrow.circlepath'
            isOn={preferences.ignoreClearChat === true}
            onIsOnChange={value => update({ ignoreClearChat: value })}
          />
        </Section>

        <Section
          title={t('performance')}
          footer={<NativeText>{t('performanceFooter')}</NativeText>}
        >
          <Picker
            label={t('scrollback')}
            systemImage='text.line.last.and.arrowtriangle.forward'
            selection={preferences.chatScrollback}
            onSelectionChange={value => update({ chatScrollback: value })}
          >
            {SCROLLBACK_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </NativeText>
            ))}
          </Picker>
        </Section>

        {providerSections.map(section => (
          <Section key={section.title} title={section.title}>
            <Toggle
              label={t('emotes')}
              systemImage='face.smiling'
              isOn={section.emotes}
              onIsOnChange={section.onEmotes}
            />
            {hostPreview(
              <ProviderPreviewItem
                enabled={section.emotes}
                provider={section.provider}
                variant='emotes'
              />,
              false,
            )}
            <Toggle
              label={t('badges')}
              systemImage='rosette'
              isOn={section.badges}
              onIsOnChange={section.onBadges}
            />
            {hostPreview(
              <ProviderPreviewItem
                enabled={section.badges}
                provider={section.provider}
                variant='badges'
              />,
              false,
            )}
          </Section>
        ))}

        <Section
          title={t('media')}
          footer={<NativeText>{t('mediaFooter')}</NativeText>}
        >
          <Toggle
            label={t('disableEmoteAnimations')}
            systemImage='slash.circle'
            isOn={preferences.disableEmoteAnimations}
            onIsOnChange={value => update({ disableEmoteAnimations: value })}
          />
          {hostPreview(
            <ChatPreferencePreview
              variant='emoteAnimations'
              value={preferences.disableEmoteAnimations}
            />,
          )}
        </Section>
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  previewRow: {
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  previewSpacer: {
    marginTop: theme.space8,
  },
});
