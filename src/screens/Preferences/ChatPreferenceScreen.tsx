import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import {
  SettingsLinkRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/Text/Text';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import {
  EMOJI_STYLE_OPTIONS,
  type EmojiStyle,
} from '@app/utils/emoji/emojiEmotes';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRef } from 'react';

export function ChatPreferenceScreen() {
  const {
    chatDensity,
    chatTimestamps,
    disableEmoteAnimations,
    emojiStyle,
    highlightOwnMentions,
    showInlineReplyContext,
    showUnreadJumpPill,
    show7TvEmotes,
    show7tvBadges,
    showBttvEmotes,
    showBttvBadges,
    showFFzEmotes,
    showFFzBadges,
    showTwitchEmotes,
    showTwitchBadges,
    update,
  } = usePreferences();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  const toggleDensity = () => {
    update({
      chatDensity: chatDensity === 'compact' ? 'comfortable' : 'compact',
    });
  };

  const cycleEmojiStyle = () => {
    const currentIndex = EMOJI_STYLE_OPTIONS.findIndex(
      option => option.value === emojiStyle,
    );
    const nextOption =
      EMOJI_STYLE_OPTIONS[(currentIndex + 1) % EMOJI_STYLE_OPTIONS.length]
        ?.value ?? 'twitter';

    update({
      emojiStyle: nextOption as EmojiStyle,
    });
  };

  const emojiStyleLabel =
    EMOJI_STYLE_OPTIONS.find(option => option.value === emojiStyle)?.label ??
    'Twitter';

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.iosContent}>
          <View style={styles.iosIntro}>
            <Text type="2xl" weight="bold">
              Chat
            </Text>
            <Text type="sm" color="gray.textLow" style={styles.iosIntroCopy}>
              Native grouped settings for message density, context, and provider
              media.
            </Text>
          </View>

          <Form.Section title="Layout">
            <Form.Link
              hint={chatDensity === 'compact' ? 'Compact' : 'Comfortable'}
              onPress={toggleDensity}
            >
              Message Density
            </Form.Link>
            <Form.Link hint={emojiStyleLabel} onPress={cycleEmojiStyle}>
              Emoji Style
            </Form.Link>
            <View style={styles.iosToggleRow}>
              <Form.Text>Show Timestamps</Form.Text>
              <Switch
                value={chatTimestamps}
                onValueChange={value => update({ chatTimestamps: value })}
              />
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text>Highlight Own Mentions</Form.Text>
              <Switch
                value={highlightOwnMentions}
                onValueChange={value => update({ highlightOwnMentions: value })}
              />
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text>Inline Reply Context</Form.Text>
              <Switch
                value={showInlineReplyContext}
                onValueChange={value =>
                  update({ showInlineReplyContext: value })
                }
              />
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text>Show Jump Pill</Form.Text>
              <Switch
                value={showUnreadJumpPill}
                onValueChange={value => update({ showUnreadJumpPill: value })}
              />
            </View>
          </Form.Section>

          <Form.Section title="7TV">
            <View style={styles.iosToggleRow}>
              <Form.Text>Emotes</Form.Text>
              <Switch
                value={show7TvEmotes}
                onValueChange={value => update({ show7TvEmotes: value })}
              />
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text>Badges</Form.Text>
              <Switch
                value={show7tvBadges}
                onValueChange={value => update({ show7tvBadges: value })}
              />
            </View>
          </Form.Section>

          <Form.Section title="BTTV">
            <View style={styles.iosToggleRow}>
              <Form.Text>Emotes</Form.Text>
              <Switch
                value={showBttvEmotes}
                onValueChange={value => update({ showBttvEmotes: value })}
              />
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text>Badges</Form.Text>
              <Switch
                value={showBttvBadges}
                onValueChange={value => update({ showBttvBadges: value })}
              />
            </View>
          </Form.Section>

          <Form.Section title="FFZ">
            <View style={styles.iosToggleRow}>
              <Form.Text>Emotes</Form.Text>
              <Switch
                value={showFFzEmotes}
                onValueChange={value => update({ showFFzEmotes: value })}
              />
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text>Badges</Form.Text>
              <Switch
                value={showFFzBadges}
                onValueChange={value => update({ showFFzBadges: value })}
              />
            </View>
          </Form.Section>

          <Form.Section title="Twitch">
            <View style={styles.iosToggleRow}>
              <Form.Text>Emotes</Form.Text>
              <Switch
                value={showTwitchEmotes}
                onValueChange={value => update({ showTwitchEmotes: value })}
              />
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text>Badges</Form.Text>
              <Switch
                value={showTwitchBadges}
                onValueChange={value => update({ showTwitchBadges: value })}
              />
            </View>
          </Form.Section>

          <Form.Section
            title="Media"
            footer="Animated Twitch, BTTV, FFZ, and 7TV emotes render as still images when disabled."
          >
            <View style={styles.iosToggleRow}>
              <Form.Text>Disable Emote Animations</Form.Text>
              <Switch
                value={disableEmoteAnimations}
                onValueChange={value =>
                  update({ disableEmoteAnimations: value })
                }
              />
            </View>
          </Form.Section>
        </BodyScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader
          title="Chat"
          subtitle="Native grouped settings for message density, context, and provider media."
          size="medium"
        />

        <SettingsSection title="Layout">
          <SettingsLinkRow
            title="Message Density"
            subtitle="Switch between compact and comfortable message rows"
            icon={{ icon: 'align-left', color: theme.colorGrey }}
            value={chatDensity === 'compact' ? 'Compact' : 'Comfortable'}
            onPress={toggleDensity}
          />
          <SettingsLinkRow
            title="Emoji Style"
            subtitle="Choose the default emoji image set used in chat"
            icon={{ icon: 'smile', color: theme.colorAmber }}
            value={emojiStyleLabel}
            onPress={cycleEmojiStyle}
          />
          <SettingsToggleRow
            title="Show Timestamps"
            subtitle="Display message timestamps inline"
            icon={{ icon: 'clock', color: theme.colorBlue }}
            value={chatTimestamps}
            onValueChange={value => update({ chatTimestamps: value })}
          />
          <SettingsToggleRow
            title="Highlight Own Mentions"
            subtitle="Accent messages that mention your username"
            icon={{ icon: 'at-sign', color: theme.colorViolet }}
            value={highlightOwnMentions}
            onValueChange={value => update({ highlightOwnMentions: value })}
          />
          <SettingsToggleRow
            title="Inline Reply Context"
            subtitle="Show the replied-to message above responses"
            icon={{ icon: 'corner-up-left', color: theme.colorPlum }}
            value={showInlineReplyContext}
            onValueChange={value => update({ showInlineReplyContext: value })}
          />
          <SettingsToggleRow
            title="Show Jump Pill"
            subtitle="Display the unread jump-to-latest affordance"
            icon={{
              icon: 'arrow-down-circle',
              color: theme.colorAmber,
            }}
            value={showUnreadJumpPill}
            onValueChange={value => update({ showUnreadJumpPill: value })}
          />
        </SettingsSection>

        <SettingsSection title="7TV">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render 7TV emotes in chat"
            value={show7TvEmotes}
            onValueChange={value => update({ show7TvEmotes: value })}
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render 7TV badges next to usernames"
            value={show7tvBadges}
            onValueChange={value => update({ show7tvBadges: value })}
          />
        </SettingsSection>

        <SettingsSection title="BTTV">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render BetterTTV emotes in chat"
            value={showBttvEmotes}
            onValueChange={value => update({ showBttvEmotes: value })}
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render BetterTTV badges next to usernames"
            value={showBttvBadges}
            onValueChange={value => update({ showBttvBadges: value })}
          />
        </SettingsSection>

        <SettingsSection title="FFZ">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render FrankerFaceZ emotes in chat"
            value={showFFzEmotes}
            onValueChange={value => update({ showFFzEmotes: value })}
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render FrankerFaceZ badges next to usernames"
            value={showFFzBadges}
            onValueChange={value => update({ showFFzBadges: value })}
          />
        </SettingsSection>

        <SettingsSection title="Twitch">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render native Twitch emotes in chat"
            value={showTwitchEmotes}
            onValueChange={value => update({ showTwitchEmotes: value })}
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render native Twitch badges next to usernames"
            value={showTwitchBadges}
            onValueChange={value => update({ showTwitchBadges: value })}
          />
        </SettingsSection>

        <SettingsSection
          title="Media"
          footer={
            <Text color="gray.textLow" type="xs">
              Animated Twitch, BTTV, FFZ, and 7TV emotes will render as still
              images when this is enabled.
            </Text>
          }
        >
          <SettingsToggleRow
            title="Disable Emote Animations"
            subtitle="Prefer static emote rendering"
            icon={{ icon: 'circle-off', color: theme.colorRed }}
            value={disableEmoteAnimations}
            onValueChange={value => update({ disableEmoteAnimations: value })}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    paddingBottom: theme.space56,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  iosContent: {
    paddingBottom: theme.space56,
    paddingTop: theme.space12,
  },
  iosIntro: {
    gap: theme.space8,
    paddingBottom: theme.space12,
    paddingHorizontal: 20,
  },
  iosIntroCopy: {
    maxWidth: 320,
  },
  iosToggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
});
