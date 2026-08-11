import { type ReactElement, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

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
  CHAT_DELAY_OPTIONS,
  DELETED_STYLE_OPTIONS,
  DENSITY_OPTIONS,
  EMOJI_PREVIEW_SHORTCODES,
  FONT_SCALE_OPTIONS,
  type PreviewProvider,
  SCROLLBACK_OPTIONS,
  TIMESTAMP_FORMAT_OPTIONS,
} from './chatPreferenceTypes';

function hostPreview(node: ReactElement, width: number, padded = true) {
  return (
    <RNHostView matchContents>
      <View style={[{ width }, padded ? styles.previewRow : null]}>{node}</View>
    </RNHostView>
  );
}

export function ChatPreferenceForm() {
  const preferences = usePreferences();
  const { update } = preferences;
  const { width: windowWidth } = useWindowDimensions();
  const previewWidth = windowWidth - theme.space16 * 2;

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
        <Section title='Layout'>
          <Picker
            label='Message Density'
            systemImage='list.bullet'
            selection={preferences.chatDensity}
            onSelectionChange={value => update({ chatDensity: value })}
          >
            {DENSITY_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </NativeText>
            ))}
          </Picker>
          {hostPreview(
            <DensityPreview density={preferences.chatDensity} />,
            previewWidth,
          )}
          <Picker
            label='Font Size'
            systemImage='textformat.size'
            selection={preferences.chatFontScale}
            onSelectionChange={value => update({ chatFontScale: value })}
          >
            {FONT_SCALE_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </NativeText>
            ))}
          </Picker>
          {hostPreview(
            <ChatPreferencePreview
              variant='fontScale'
              value={preferences.chatFontScale}
            />,
            previewWidth,
          )}
          <Toggle
            label='Alternating Rows'
            systemImage='line.3.horizontal'
            isOn={preferences.showAlternatingChatRows}
            onIsOnChange={value => update({ showAlternatingChatRows: value })}
          />
          {hostPreview(
            <ChatPreferencePreview
              variant='alternatingRows'
              value={preferences.showAlternatingChatRows}
            />,
            previewWidth,
          )}
          <Toggle
            label='New Message Animation'
            systemImage='arrow.up.message'
            isOn={preferences.animate}
            onIsOnChange={value => update({ animate: value })}
          />
        </Section>

        <Section title='Emoji Style'>
          <Picker
            label='Emoji Set'
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
          {hostPreview(
            <EmojiStylePreview emotes={emojiPreviewEmotes} />,
            previewWidth,
          )}
        </Section>

        <Section title='Context'>
          <Toggle
            label='Historical Recent Messages'
            systemImage='clock.arrow.circlepath'
            isOn={preferences.showRecentMessages !== false}
            onIsOnChange={value => update({ showRecentMessages: value })}
          />
          <Toggle
            label='Show Timestamps'
            systemImage='clock'
            isOn={preferences.chatTimestamps}
            onIsOnChange={value => update({ chatTimestamps: value })}
          />
          <Toggle
            label='Highlight Own Mentions'
            systemImage='at'
            isOn={preferences.highlightOwnMentions}
            onIsOnChange={value => update({ highlightOwnMentions: value })}
          />
          <Toggle
            label='Inline Reply Context'
            systemImage='arrowshape.turn.up.left'
            isOn={preferences.showInlineReplyContext}
            onIsOnChange={value => update({ showInlineReplyContext: value })}
          />
          <Toggle
            label='Show Jump Pill'
            systemImage='arrow.down.circle'
            isOn={preferences.showUnreadJumpPill}
            onIsOnChange={value => update({ showUnreadJumpPill: value })}
          />
          <Picker
            label='Timestamp Format'
            systemImage='clock.badge'
            selection={preferences.chatTimestampFormat}
            onSelectionChange={value => update({ chatTimestampFormat: value })}
          >
            {TIMESTAMP_FORMAT_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
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
            previewWidth,
          )}
        </Section>

        <Section
          title='Sync'
          footer={
            <NativeText>
              Delay chat so it lines up with the video. Auto matches the
              measured stream latency.
            </NativeText>
          }
        >
          <Picker
            label='Chat Delay'
            systemImage='timer'
            selection={String(preferences.chatDelay)}
            onSelectionChange={value => {
              const option = CHAT_DELAY_OPTIONS.find(
                item => String(item.value) === value,
              );
              if (option) {
                update({ chatDelay: option.value });
              }
            }}
          >
            {CHAT_DELAY_OPTIONS.map(option => (
              // SwiftUI tag matching needs one type; the values mix 'auto'/'off' and numbers.
              <NativeText
                key={option.value}
                modifiers={[tag(String(option.value))]}
              >
                {option.label}
              </NativeText>
            ))}
          </Picker>
        </Section>

        <Section
          title='Highlights'
          footer={
            <NativeText>
              Highlighted phrases tint matching messages. Mention feedback also
              buzzes when a highlight matches.
            </NativeText>
          }
        >
          <Button
            label='Highlighted Phrases'
            systemImage='highlighter'
            onPress={() => router.push('/tabs/settings/chat-highlights')}
          />
          <Toggle
            label='Mention Feedback'
            systemImage='hand.tap'
            isOn={preferences.chatMentionHaptics !== false}
            onIsOnChange={value => update({ chatMentionHaptics: value })}
          />
        </Section>

        <Section title='Moderation'>
          <Picker
            label='Deleted Messages'
            systemImage='trash.slash'
            selection={preferences.deletedMessageStyle}
            onSelectionChange={value => update({ deletedMessageStyle: value })}
          >
            {DELETED_STYLE_OPTIONS.map(option => (
              <NativeText key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </NativeText>
            ))}
          </Picker>
          <Toggle
            label='Keep History on Clear'
            systemImage='clock.arrow.circlepath'
            isOn={preferences.ignoreClearChat === true}
            onIsOnChange={value => update({ ignoreClearChat: value })}
          />
        </Section>

        <Section
          title='Performance'
          footer={
            <NativeText>
              Longer scrollback keeps more messages in memory; 200 is easier on
              older devices.
            </NativeText>
          }
        >
          <Picker
            label='Scrollback'
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
              label='Emotes'
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
              previewWidth,
              false,
            )}
            <Toggle
              label='Badges'
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
              previewWidth,
              false,
            )}
          </Section>
        ))}

        <Section
          title='Media'
          footer={
            <NativeText>
              Animated Twitch, BTTV, FFZ, and 7TV emotes will render as still
              images when this is enabled.
            </NativeText>
          }
        >
          <Toggle
            label='Disable Emote Animations'
            systemImage='slash.circle'
            isOn={preferences.disableEmoteAnimations}
            onIsOnChange={value => update({ disableEmoteAnimations: value })}
          />
          {hostPreview(
            <ChatPreferencePreview
              variant='emoteAnimations'
              value={preferences.disableEmoteAnimations}
            />,
            previewWidth,
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
