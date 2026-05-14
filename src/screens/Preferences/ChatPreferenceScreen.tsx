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
import { Text } from '@app/components/ui/Text/Text';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import {
  EMOJI_STYLE_OPTIONS,
  getEmojiEmotes,
  type EmojiStyle,
} from '@app/utils/emoji/emojiEmotes';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const DENSITY_OPTIONS = [
  { label: 'Comfortable', value: 'comfortable' as const },
  { label: 'Compact', value: 'compact' as const },
] as const;
const DENSITY_LABELS = DENSITY_OPTIONS.map(option => option.label);
const EMOJI_PREVIEW_SHORTCODES = [':joy:', ':heart:', ':fire:'];

function IosToggleRow({
  custom: _custom,
  label,
  value,
  onValueChange,
}: {
  custom?: true;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.iosToggleRow}>
      <Text color="gray" style={styles.iosToggleLabel}>
        {label}
      </Text>
      <View style={styles.iosSwitchSlot}>
        <Switch value={value} onValueChange={onValueChange} />
      </View>
    </View>
  );
}

type SegmentedControlChangeEvent = {
  nativeEvent: {
    selectedSegmentIndex: number;
  };
};

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
    const preview = EMOJI_PREVIEW_SHORTCODES.map(shortcode =>
      emotes.find(emote => emote.name === shortcode),
    ).filter(Boolean) as SanitisedEmote[];

    if (preview.length > 0) {
      return preview;
    }

    return emotes.slice(0, 3);
  }, [previewEmojiStyle]);
  const contextPreviewValue = useMemo(
    () => ({
      chatTimestamps,
      highlightOwnMentions,
      showInlineReplyContext,
      showUnreadJumpPill,
    }),
    [
      chatTimestamps,
      highlightOwnMentions,
      showInlineReplyContext,
      showUnreadJumpPill,
    ],
  );

  useEffect(() => {
    setPreviewDensity(chatDensity);
  }, [chatDensity]);

  useEffect(() => {
    setPreviewEmojiStyle(emojiStyle);
  }, [emojiStyle]);

  const handleDensitySelect = useCallback(
    (nextDensity: 'comfortable' | 'compact') => {
      setPreviewDensity(nextDensity);
      update({
        chatDensity: nextDensity,
      });
    },
    [update],
  );

  const handleDensityChange = useCallback(
    (event: SegmentedControlChangeEvent) => {
      const nextDensity =
        DENSITY_OPTIONS[event.nativeEvent.selectedSegmentIndex]?.value;

      if (!nextDensity) {
        return;
      }

      handleDensitySelect(nextDensity);
    },
    [handleDensitySelect],
  );

  const handleDensityValueChange = useCallback(
    (value: string) => {
      const selected = DENSITY_OPTIONS.find(option => option.label === value);

      if (!selected) {
        return;
      }

      handleDensitySelect(selected.value);
    },
    [handleDensitySelect],
  );

  const handleEmojiStyleChange = useCallback(
    (value: string) => {
      const option = EMOJI_STYLE_OPTIONS.find(option => option.label === value);

      if (!option) {
        return;
      }

      setPreviewEmojiStyle(option.value as EmojiStyle);
      update({ emojiStyle: option.value as EmojiStyle });
    },
    [update],
  );

  const handleEmojiStyleChangeByIndex = useCallback(
    (event: SegmentedControlChangeEvent) => {
      const option =
        EMOJI_STYLE_OPTIONS[event.nativeEvent.selectedSegmentIndex];

      if (!option) {
        return;
      }

      setPreviewEmojiStyle(option.value as EmojiStyle);
      update({ emojiStyle: option.value as EmojiStyle });
    },
    [update],
  );

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
                  onChange={handleDensityChange}
                  onValueChange={handleDensityValueChange}
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
                  onChange={handleEmojiStyleChangeByIndex}
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
            <IosToggleRow
              custom
              label="Show Timestamps"
              value={chatTimestamps}
              onValueChange={value => update({ chatTimestamps: value })}
            />
            <IosToggleRow
              custom
              label="Highlight Own Mentions"
              value={highlightOwnMentions}
              onValueChange={value => update({ highlightOwnMentions: value })}
            />
            <IosToggleRow
              custom
              label="Inline Reply Context"
              value={showInlineReplyContext}
              onValueChange={value => update({ showInlineReplyContext: value })}
            />
            <IosToggleRow
              custom
              label="Show Jump Pill"
              value={showUnreadJumpPill}
              onValueChange={value => update({ showUnreadJumpPill: value })}
            />
            <View style={styles.iosPreviewItem}>
              <Text type="xs" color="gray.textLow" weight="semibold">
                Preview
              </Text>
              <ChatPreferencePreview
                variant="context"
                value={contextPreviewValue}
              />
            </View>
          </Form.Section>

          <Form.Section title="7TV">
            <ProviderTogglePreviewItem
              custom
              enabled={show7TvEmotes}
              label="Emotes"
              onValueChange={value => update({ show7TvEmotes: value })}
              provider="7tv"
              variant="emotes"
            />
            <ProviderTogglePreviewItem
              custom
              enabled={show7tvBadges}
              label="Badges"
              onValueChange={value => update({ show7tvBadges: value })}
              provider="7tv"
              variant="badges"
            />
          </Form.Section>

          <Form.Section title="BTTV">
            <ProviderTogglePreviewItem
              custom
              enabled={showBttvEmotes}
              label="Emotes"
              onValueChange={value => update({ showBttvEmotes: value })}
              provider="bttv"
              variant="emotes"
            />
            <ProviderTogglePreviewItem
              custom
              enabled={showBttvBadges}
              label="Badges"
              onValueChange={value => update({ showBttvBadges: value })}
              provider="bttv"
              variant="badges"
            />
          </Form.Section>

          <Form.Section title="FFZ">
            <ProviderTogglePreviewItem
              custom
              enabled={showFFzEmotes}
              label="Emotes"
              onValueChange={value => update({ showFFzEmotes: value })}
              provider="ffz"
              variant="emotes"
            />
            <ProviderTogglePreviewItem
              custom
              enabled={showFFzBadges}
              label="Badges"
              onValueChange={value => update({ showFFzBadges: value })}
              provider="ffz"
              variant="badges"
            />
          </Form.Section>

          <Form.Section title="Twitch">
            <ProviderTogglePreviewItem
              custom
              enabled={showTwitchEmotes}
              label="Emotes"
              onValueChange={value => update({ showTwitchEmotes: value })}
              provider="twitch"
              variant="emotes"
            />
            <ProviderTogglePreviewItem
              custom
              enabled={showTwitchBadges}
              label="Badges"
              onValueChange={value => update({ showTwitchBadges: value })}
              provider="twitch"
              variant="badges"
            />
          </Form.Section>

          <Form.Section
            title="Media"
            footer="Animated Twitch, BTTV, FFZ, and 7TV emotes render as still images when disabled."
          >
            <IosToggleRow
              custom
              label="Disable Emote Animations"
              value={disableEmoteAnimations}
              onValueChange={value => update({ disableEmoteAnimations: value })}
            />
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
                onChange={handleDensityChange}
                onValueChange={handleDensityValueChange}
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
                onChange={handleEmojiStyleChangeByIndex}
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
          <View style={styles.settingsPreviewItem}>
            <Text type="xs" color="gray.textLow" weight="semibold">
              Preview
            </Text>
            <View style={styles.previewSpacer}>
              <ChatPreferencePreview
                variant="context"
                value={contextPreviewValue}
              />
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title="7TV">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render 7TV emotes in chat"
            value={show7TvEmotes}
            onValueChange={value => update({ show7TvEmotes: value })}
          />
          <ProviderPreviewItem
            enabled={show7TvEmotes}
            provider="7tv"
            variant="emotes"
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render 7TV badges next to usernames"
            value={show7tvBadges}
            onValueChange={value => update({ show7tvBadges: value })}
          />
          <ProviderPreviewItem
            enabled={show7tvBadges}
            provider="7tv"
            variant="badges"
          />
        </SettingsSection>

        <SettingsSection title="BTTV">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render BetterTTV emotes in chat"
            value={showBttvEmotes}
            onValueChange={value => update({ showBttvEmotes: value })}
          />
          <ProviderPreviewItem
            enabled={showBttvEmotes}
            provider="bttv"
            variant="emotes"
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render BetterTTV badges next to usernames"
            value={showBttvBadges}
            onValueChange={value => update({ showBttvBadges: value })}
          />
          <ProviderPreviewItem
            enabled={showBttvBadges}
            provider="bttv"
            variant="badges"
          />
        </SettingsSection>

        <SettingsSection title="FFZ">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render FrankerFaceZ emotes in chat"
            value={showFFzEmotes}
            onValueChange={value => update({ showFFzEmotes: value })}
          />
          <ProviderPreviewItem
            enabled={showFFzEmotes}
            provider="ffz"
            variant="emotes"
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render FrankerFaceZ badges next to usernames"
            value={showFFzBadges}
            onValueChange={value => update({ showFFzBadges: value })}
          />
          <ProviderPreviewItem
            enabled={showFFzBadges}
            provider="ffz"
            variant="badges"
          />
        </SettingsSection>

        <SettingsSection title="Twitch">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render native Twitch emotes in chat"
            value={showTwitchEmotes}
            onValueChange={value => update({ showTwitchEmotes: value })}
          />
          <ProviderPreviewItem
            enabled={showTwitchEmotes}
            provider="twitch"
            variant="emotes"
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render native Twitch badges next to usernames"
            value={showTwitchBadges}
            onValueChange={value => update({ showTwitchBadges: value })}
          />
          <ProviderPreviewItem
            enabled={showTwitchBadges}
            provider="twitch"
            variant="badges"
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
            icon={{ icon: 'slash', color: theme.colorRed }}
            value={disableEmoteAnimations}
            onValueChange={value => update({ disableEmoteAnimations: value })}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const DensityPreview = memo(function DensityPreview({
  density,
}: {
  density: 'comfortable' | 'compact';
}) {
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
});

DensityPreview.displayName = 'DensityPreview';

const PreviewMessage = memo(function PreviewMessage({
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
});

PreviewMessage.displayName = 'PreviewMessage';

const EmojiStylePreview = memo(function EmojiStylePreview({
  emotes,
}: {
  emotes: SanitisedEmote[];
}) {
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
});

EmojiStylePreview.displayName = 'EmojiStylePreview';

function ProviderTogglePreviewItem({
  custom: _custom,
  enabled,
  label,
  onValueChange,
  provider,
  variant,
}: {
  custom?: true;
  enabled: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
  provider: '7tv' | 'bttv' | 'ffz' | 'twitch';
  variant: 'badges' | 'emotes';
}) {
  return (
    <View style={styles.providerTogglePreviewItem}>
      <View style={styles.providerToggleHeader}>
        <Text color="gray" style={styles.iosToggleLabel}>
          {label}
        </Text>
        <View style={styles.iosSwitchSlot}>
          <Switch value={enabled} onValueChange={onValueChange} />
        </View>
      </View>
      <ChatPreferencePreview
        provider={provider}
        variant={variant === 'emotes' ? 'providerEmotes' : 'providerBadges'}
        value={enabled}
      />
    </View>
  );
}

const ProviderPreviewItem = memo(function ProviderPreviewItem({
  enabled,
  provider,
  variant,
}: {
  enabled: boolean;
  provider: '7tv' | 'bttv' | 'ffz' | 'twitch';
  variant: 'badges' | 'emotes';
}) {
  return (
    <View style={styles.providerPreviewItem}>
      <ChatPreferencePreview
        provider={provider}
        variant={variant === 'emotes' ? 'providerEmotes' : 'providerBadges'}
        value={enabled}
      />
    </View>
  );
});

ProviderPreviewItem.displayName = 'ProviderPreviewItem';

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
  previewSpacer: {
    marginTop: theme.space8,
  },
  providerToggleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
    minHeight: 44,
  },
  providerTogglePreviewItem: {
    gap: theme.space8,
    paddingBottom: theme.space12,
    paddingHorizontal: 20,
    paddingTop: theme.space8,
  },
  providerPreviewItem: {
    gap: theme.space8,
    paddingBottom: theme.space12,
    paddingHorizontal: 20,
    paddingTop: theme.space4,
  },
  iosPreviewItem: {
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: theme.space8,
    paddingHorizontal: 20,
    paddingBottom: theme.space12,
  },
});
