import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Image } from '@app/components/Image/Image';
import {
  SettingsRow,
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Switch } from '@app/components/Switch/Switch';
import { Text } from '@app/components/Text/Text';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import {
  EMOJI_STYLE_OPTIONS,
  getEmojiEmotes,
  type EmojiStyle,
} from '@app/utils/emoji/emojiEmotes';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';

const DENSITY_LABELS = ['Comfortable', 'Compact'];
const EMOJI_PREVIEW_SHORTCODES = [':joy:', ':heart:', ':fire:'];

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
  const [previewDensity, setPreviewDensity] = useState(chatDensity);
  const [previewEmojiStyle, setPreviewEmojiStyle] = useState(emojiStyle);
  const densityIndex = previewDensity === 'compact' ? 1 : 0;
  const emojiLabels = EMOJI_STYLE_OPTIONS.map(option => option.label);
  const emojiIndex = Math.max(
    0,
    EMOJI_STYLE_OPTIONS.findIndex(option => option.value === previewEmojiStyle),
  );
  const emojiPreviewEmotes = useMemo(() => {
    const emotes = getEmojiEmotes(previewEmojiStyle);

    return EMOJI_PREVIEW_SHORTCODES.map(shortcode =>
      emotes.find(emote => emote.name === shortcode),
    ).filter(Boolean) as SanitisedEmote[];
  }, [previewEmojiStyle]);

  useEffect(() => {
    setPreviewDensity(chatDensity);
  }, [chatDensity]);

  useEffect(() => {
    setPreviewEmojiStyle(emojiStyle);
  }, [emojiStyle]);

  const handleDensityChange = (value: string) => {
    const nextDensity = value === 'Compact' ? 'compact' : 'comfortable';

    setPreviewDensity(nextDensity);
    update({
      chatDensity: nextDensity,
    });
  };

  const handleEmojiStyleChange = (value: string) => {
    const option = EMOJI_STYLE_OPTIONS.find(option => option.label === value);

    if (!option) {
      return;
    }

    setPreviewEmojiStyle(option.value as EmojiStyle);
    update({ emojiStyle: option.value as EmojiStyle });
  };

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView contentContainerStyle={styles.iosContent}>
          <ScreenHeader
            title="Chat"
            subtitle="Message controls"
            size="medium"
          />

          <Form.Section title="Layout">
            <Form.FormItem style={styles.iosControlItem}>
              <View style={styles.iosControlBody}>
                <View style={styles.controlCopy}>
                  <Form.Text style={styles.iosControlTitle}>
                    Message Density
                  </Form.Text>
                  <Form.Text style={styles.iosControlSubtitle}>
                    {previewDensity === 'compact'
                      ? 'Tighter rows for faster scanning'
                      : 'Roomier rows with more breathing space'}
                  </Form.Text>
                </View>
                <SegmentedControl
                  appearance="dark"
                  onValueChange={handleDensityChange}
                  selectedIndex={densityIndex}
                  style={styles.iosSegmentedControl}
                  tintColor={theme.colorDarkGreen}
                  values={DENSITY_LABELS}
                />
                <DensityPreview density={previewDensity} />
              </View>
            </Form.FormItem>
          </Form.Section>

          <Form.Section title="Emoji Style">
            <Form.FormItem style={styles.iosControlItem}>
              <View style={styles.iosControlBody}>
                <View style={styles.controlCopy}>
                  <Form.Text style={styles.iosControlTitle}>
                    Emoji Set
                  </Form.Text>
                  <Form.Text style={styles.iosControlSubtitle}>
                    Changes emoji images in existing chat messages
                  </Form.Text>
                </View>
                <SegmentedControl
                  appearance="dark"
                  onValueChange={handleEmojiStyleChange}
                  selectedIndex={emojiIndex}
                  style={styles.iosSegmentedControl}
                  tintColor={theme.colorDarkGreen}
                  values={emojiLabels}
                />
                <EmojiStylePreview emotes={emojiPreviewEmotes} />
              </View>
            </Form.FormItem>
          </Form.Section>

          <Form.Section title="Context">
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>
                Show Timestamps
              </Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={chatTimestamps}
                  onValueChange={value => update({ chatTimestamps: value })}
                />
              </View>
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>
                Highlight Own Mentions
              </Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={highlightOwnMentions}
                  onValueChange={value =>
                    update({ highlightOwnMentions: value })
                  }
                />
              </View>
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>
                Inline Reply Context
              </Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={showInlineReplyContext}
                  onValueChange={value =>
                    update({ showInlineReplyContext: value })
                  }
                />
              </View>
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>
                Show Jump Pill
              </Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={showUnreadJumpPill}
                  onValueChange={value => update({ showUnreadJumpPill: value })}
                />
              </View>
            </View>
          </Form.Section>

          <Form.Section title="7TV">
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>Emotes</Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={show7TvEmotes}
                  onValueChange={value => update({ show7TvEmotes: value })}
                />
              </View>
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>Badges</Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={show7tvBadges}
                  onValueChange={value => update({ show7tvBadges: value })}
                />
              </View>
            </View>
          </Form.Section>

          <Form.Section title="BTTV">
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>Emotes</Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={showBttvEmotes}
                  onValueChange={value => update({ showBttvEmotes: value })}
                />
              </View>
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>Badges</Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={showBttvBadges}
                  onValueChange={value => update({ showBttvBadges: value })}
                />
              </View>
            </View>
          </Form.Section>

          <Form.Section title="FFZ">
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>Emotes</Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={showFFzEmotes}
                  onValueChange={value => update({ showFFzEmotes: value })}
                />
              </View>
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>Badges</Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={showFFzBadges}
                  onValueChange={value => update({ showFFzBadges: value })}
                />
              </View>
            </View>
          </Form.Section>

          <Form.Section title="Twitch">
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>Emotes</Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={showTwitchEmotes}
                  onValueChange={value => update({ showTwitchEmotes: value })}
                />
              </View>
            </View>
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>Badges</Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={showTwitchBadges}
                  onValueChange={value => update({ showTwitchBadges: value })}
                />
              </View>
            </View>
          </Form.Section>

          <Form.Section
            title="Media"
            footer="Animated Twitch, BTTV, FFZ, and 7TV emotes render as still images when disabled."
          >
            <View style={styles.iosToggleRow}>
              <Form.Text style={styles.iosToggleLabel}>
                Disable Emote Animations
              </Form.Text>
              <View style={styles.iosSwitchSlot}>
                <Switch
                  value={disableEmoteAnimations}
                  onValueChange={value =>
                    update({ disableEmoteAnimations: value })
                  }
                />
              </View>
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
          <SettingsRow
            title="Message Density"
            subtitle={
              previewDensity === 'compact'
                ? 'Tighter rows for faster scanning'
                : 'Roomier rows with more breathing space'
            }
            icon={{ icon: 'list', color: theme.colorGrey }}
            trailing={
              <SegmentedControl
                appearance="dark"
                onValueChange={handleDensityChange}
                selectedIndex={densityIndex}
                style={styles.segmentedControl}
                tintColor={theme.colorDarkGreen}
                values={DENSITY_LABELS}
              />
            }
          />
          <View style={styles.settingsPreviewItem}>
            <DensityPreview density={previewDensity} />
          </View>
        </SettingsSection>

        <SettingsSection title="Emoji Style">
          <SettingsRow
            title="Emoji Set"
            subtitle="Changes emoji images in existing chat messages"
            icon={{ icon: 'smile', color: theme.colorAmber }}
            trailing={
              <SegmentedControl
                appearance="dark"
                onValueChange={handleEmojiStyleChange}
                selectedIndex={emojiIndex}
                style={styles.segmentedControl}
                tintColor={theme.colorDarkGreen}
                values={emojiLabels}
              />
            }
          />
          <View style={styles.settingsPreviewItem}>
            <EmojiStylePreview emotes={emojiPreviewEmotes} />
          </View>
        </SettingsSection>

        <SettingsSection title="Context">
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

function DensityPreview({ density }: { density: 'comfortable' | 'compact' }) {
  const compact = density === 'compact';

  return (
    <View style={[styles.previewPanel, compact && styles.previewPanelCompact]}>
      <PreviewMessage
        compact={compact}
        time="12:42"
        username="needlework"
        message="linework healed clean"
      />
      <PreviewMessage
        compact={compact}
        time="12:43"
        username="inkmod"
        message="shading pass is ready"
      />
    </View>
  );
}

function PreviewMessage({
  compact,
  message,
  time,
  username,
}: {
  compact: boolean;
  message: string;
  time: string;
  username: string;
}) {
  return (
    <View
      style={[styles.previewMessage, compact && styles.previewMessageCompact]}
    >
      <Text style={[styles.previewTime, compact && styles.previewTextCompact]}>
        {time}
      </Text>
      <Text
        weight="bold"
        style={[styles.previewUsername, compact && styles.previewTextCompact]}
      >
        {username}
      </Text>
      <Text style={[styles.previewText, compact && styles.previewTextCompact]}>
        {message}
      </Text>
    </View>
  );
}

function EmojiStylePreview({ emotes }: { emotes: SanitisedEmote[] }) {
  return (
    <View style={styles.previewPanel}>
      <View style={styles.emojiPreviewRow}>
        {emotes.map(emote => (
          <View key={`${emote.site}-${emote.name}`} style={styles.emojiTile}>
            <Image
              cachePolicy="memory-disk"
              contentFit="contain"
              source={{ uri: emote.url }}
              style={styles.emojiImage}
              transition={0}
            />
          </View>
        ))}
      </View>
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
  controlCopy: {
    flex: 1,
    gap: theme.space4,
    minWidth: 0,
  },
  iosControlItem: {
    gap: theme.space12,
  },
  iosControlBody: {
    gap: theme.space12,
    width: '100%',
  },
  iosControlSubtitle: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
  },
  iosControlTitle: {
    fontWeight: '600',
  },
  iosSegmentedControl: {
    height: 36,
    width: '100%',
  },
  iosToggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  iosToggleLabel: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  iosSwitchSlot: {
    alignItems: 'flex-end',
    flexShrink: 0,
    width: 76,
  },
  emojiImage: {
    height: 28,
    width: 28,
  },
  emojiPreviewRow: {
    flexDirection: 'row',
    gap: theme.space8,
  },
  emojiTile: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    borderColor: theme.colorBorderSecondary,
    borderRadius: theme.borderRadius6,
    borderWidth: StyleSheet.hairlineWidth,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  previewMessage: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 30,
  },
  previewMessageCompact: {
    gap: theme.space4,
    minHeight: 20,
  },
  previewPanel: {
    backgroundColor: theme.color.background.dark,
    borderColor: theme.colorBorderSecondary,
    borderRadius: theme.borderRadius6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.space4,
    padding: theme.space8,
  },
  previewPanelCompact: {
    gap: theme.space2,
    paddingVertical: theme.space4,
  },
  previewText: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize12,
    lineHeight: 18,
  },
  previewTextCompact: {
    fontSize: theme.fontSize11,
    lineHeight: 14,
  },
  previewTime: {
    color: theme.colorGreyAlpha,
    fontSize: theme.fontSize11,
  },
  previewUsername: {
    color: theme.colorLightGreen,
    fontSize: theme.fontSize12,
  },
  segmentedControl: {
    height: 36,
    width: 180,
  },
  settingsPreviewItem: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: theme.space16,
  },
});
