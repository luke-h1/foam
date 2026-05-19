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
import { Text, type TextType } from '@app/components/ui/Text/Text';
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
const HISTORICAL_RECENT_MESSAGES_EXPLAINER =
  'Loads historical recent messages in chat through the third-party API service at recent-messages.robotty.de.';
type ContextPreviewValue = {
  chatTimestamps: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showUnreadJumpPill: boolean;
};
type ProviderPreviewValue = {
  show7TvEmotes: boolean;
  show7tvBadges: boolean;
  showBttvEmotes: boolean;
  showBttvBadges: boolean;
  showFFzEmotes: boolean;
  showFFzBadges: boolean;
  showTwitchEmotes: boolean;
  showTwitchBadges: boolean;
};

function sameContextPreview(
  left: ContextPreviewValue,
  right: ContextPreviewValue,
) {
  return (
    left.chatTimestamps === right.chatTimestamps &&
    left.highlightOwnMentions === right.highlightOwnMentions &&
    left.showInlineReplyContext === right.showInlineReplyContext &&
    left.showUnreadJumpPill === right.showUnreadJumpPill
  );
}

function sameProviderPreview(
  left: ProviderPreviewValue,
  right: ProviderPreviewValue,
) {
  return (
    left.show7TvEmotes === right.show7TvEmotes &&
    left.show7tvBadges === right.show7tvBadges &&
    left.showBttvEmotes === right.showBttvEmotes &&
    left.showBttvBadges === right.showBttvBadges &&
    left.showFFzEmotes === right.showFFzEmotes &&
    left.showFFzBadges === right.showFFzBadges &&
    left.showTwitchEmotes === right.showTwitchEmotes &&
    left.showTwitchBadges === right.showTwitchBadges
  );
}

function IosToggleRow({
  custom: _custom,
  label,
  subtitle,
  value,
  onValueChange,
}: {
  custom?: true;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.iosToggleRow}>
      <View style={styles.iosToggleCopy}>
        <Text color="gray" style={styles.iosToggleLabel} weight="semibold">
          {label}
        </Text>
        {subtitle ? (
          <Text color="gray.textLow" style={styles.iosToggleSubtitle} type="xs">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.iosSwitchSlot}>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onValueChange}
        />
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
    showRecentMessages,
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
  const [previewContext, setPreviewContext] = useState<ContextPreviewValue>({
    chatTimestamps,
    highlightOwnMentions,
    showInlineReplyContext,
    showUnreadJumpPill,
  });
  const [previewDisableEmoteAnimations, setPreviewDisableEmoteAnimations] =
    useState(disableEmoteAnimations);
  const [previewProviders, setPreviewProviders] =
    useState<ProviderPreviewValue>({
      show7TvEmotes,
      show7tvBadges,
      showBttvEmotes,
      showBttvBadges,
      showFFzEmotes,
      showFFzBadges,
      showTwitchEmotes,
      showTwitchBadges,
    });
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
      chatTimestamps: previewContext.chatTimestamps,
      highlightOwnMentions: previewContext.highlightOwnMentions,
      showInlineReplyContext: previewContext.showInlineReplyContext,
      showUnreadJumpPill: previewContext.showUnreadJumpPill,
    }),
    [
      previewContext.chatTimestamps,
      previewContext.highlightOwnMentions,
      previewContext.showInlineReplyContext,
      previewContext.showUnreadJumpPill,
    ],
  );

  useEffect(() => {
    setPreviewDensity(chatDensity);
  }, [chatDensity]);

  useEffect(() => {
    setPreviewEmojiStyle(emojiStyle);
  }, [emojiStyle]);

  useEffect(() => {
    const nextContext = {
      chatTimestamps,
      highlightOwnMentions,
      showInlineReplyContext,
      showUnreadJumpPill,
    };
    setPreviewContext(previous =>
      sameContextPreview(previous, nextContext) ? previous : nextContext,
    );
  }, [
    chatTimestamps,
    highlightOwnMentions,
    showInlineReplyContext,
    showUnreadJumpPill,
  ]);

  useEffect(() => {
    setPreviewDisableEmoteAnimations(disableEmoteAnimations);
  }, [disableEmoteAnimations]);

  useEffect(() => {
    const nextProviders = {
      show7TvEmotes,
      show7tvBadges,
      showBttvEmotes,
      showBttvBadges,
      showFFzEmotes,
      showFFzBadges,
      showTwitchEmotes,
      showTwitchBadges,
    };
    setPreviewProviders(previous =>
      sameProviderPreview(previous, nextProviders) ? previous : nextProviders,
    );
  }, [
    show7TvEmotes,
    show7tvBadges,
    showBttvEmotes,
    showBttvBadges,
    showFFzEmotes,
    showFFzBadges,
    showTwitchEmotes,
    showTwitchBadges,
  ]);

  const handleContextToggle = useCallback(
    (key: keyof ContextPreviewValue, value: boolean) => {
      setPreviewContext(previous =>
        previous[key] === value
          ? previous
          : {
              ...previous,
              [key]: value,
            },
      );
      update({ [key]: value });
    },
    [update],
  );

  const handleProviderToggle = useCallback(
    (key: keyof ProviderPreviewValue, value: boolean) => {
      setPreviewProviders(previous =>
        previous[key] === value
          ? previous
          : {
              ...previous,
              [key]: value,
            },
      );
      update({ [key]: value });
    },
    [update],
  );

  const handleDisableEmoteAnimationsToggle = useCallback(
    (value: boolean) => {
      setPreviewDisableEmoteAnimations(value);
      update({ disableEmoteAnimations: value });
    },
    [update],
  );

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
                  <Text color="gray" weight="semibold">
                    Message Density
                  </Text>
                  <Text color="gray.textLow" type="xs">
                    {previewDensity === 'compact'
                      ? 'Tighter rows for faster scanning'
                      : 'Comfy rows with more breathing space'}
                  </Text>
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
                  <Text color="gray" weight="semibold">
                    Emoji Set
                  </Text>
                  <Text color="gray.textLow" type="xs">
                    Changes emoji images in existing chat messages
                  </Text>
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
              label="Historical Recent Messages"
              subtitle={HISTORICAL_RECENT_MESSAGES_EXPLAINER}
              value={showRecentMessages !== false}
              onValueChange={value => update({ showRecentMessages: value })}
            />
            <IosToggleRow
              custom
              label="Show Timestamps"
              value={previewContext.chatTimestamps}
              onValueChange={value =>
                handleContextToggle('chatTimestamps', value)
              }
            />
            <IosToggleRow
              custom
              label="Highlight Own Mentions"
              value={previewContext.highlightOwnMentions}
              onValueChange={value =>
                handleContextToggle('highlightOwnMentions', value)
              }
            />
            <IosToggleRow
              custom
              label="Inline Reply Context"
              value={previewContext.showInlineReplyContext}
              onValueChange={value =>
                handleContextToggle('showInlineReplyContext', value)
              }
            />
            <IosToggleRow
              custom
              label="Show Jump Pill"
              value={previewContext.showUnreadJumpPill}
              onValueChange={value =>
                handleContextToggle('showUnreadJumpPill', value)
              }
            />
            <View style={styles.iosPreviewItem}>
              <PreviewLabel />
              <ChatPreferencePreview
                variant="context"
                value={contextPreviewValue}
              />
            </View>
          </Form.Section>

          <Form.Section title="7TV">
            <ProviderTogglePreviewItem
              custom
              enabled={previewProviders.show7TvEmotes}
              label="Emotes"
              onValueChange={value =>
                handleProviderToggle('show7TvEmotes', value)
              }
              provider="7tv"
              variant="emotes"
            />
            <ProviderTogglePreviewItem
              custom
              enabled={previewProviders.show7tvBadges}
              label="Badges"
              onValueChange={value =>
                handleProviderToggle('show7tvBadges', value)
              }
              provider="7tv"
              variant="badges"
            />
          </Form.Section>

          <Form.Section title="BTTV">
            <ProviderTogglePreviewItem
              custom
              enabled={previewProviders.showBttvEmotes}
              label="Emotes"
              onValueChange={value =>
                handleProviderToggle('showBttvEmotes', value)
              }
              provider="bttv"
              variant="emotes"
            />
            <ProviderTogglePreviewItem
              custom
              enabled={previewProviders.showBttvBadges}
              label="Badges"
              onValueChange={value =>
                handleProviderToggle('showBttvBadges', value)
              }
              provider="bttv"
              variant="badges"
            />
          </Form.Section>

          <Form.Section title="FFZ">
            <ProviderTogglePreviewItem
              custom
              enabled={previewProviders.showFFzEmotes}
              label="Emotes"
              onValueChange={value =>
                handleProviderToggle('showFFzEmotes', value)
              }
              provider="ffz"
              variant="emotes"
            />
            <ProviderTogglePreviewItem
              custom
              enabled={previewProviders.showFFzBadges}
              label="Badges"
              onValueChange={value =>
                handleProviderToggle('showFFzBadges', value)
              }
              provider="ffz"
              variant="badges"
            />
          </Form.Section>

          <Form.Section title="Twitch">
            <ProviderTogglePreviewItem
              custom
              enabled={previewProviders.showTwitchEmotes}
              label="Emotes"
              onValueChange={value =>
                handleProviderToggle('showTwitchEmotes', value)
              }
              provider="twitch"
              variant="emotes"
            />
            <ProviderTogglePreviewItem
              custom
              enabled={previewProviders.showTwitchBadges}
              label="Badges"
              onValueChange={value =>
                handleProviderToggle('showTwitchBadges', value)
              }
              provider="twitch"
              variant="badges"
            />
          </Form.Section>

          <Form.Section title="Media">
            <IosToggleRow
              custom
              label="Disable Emote Animations"
              value={previewDisableEmoteAnimations}
              onValueChange={handleDisableEmoteAnimationsToggle}
            />
            <View style={styles.iosPreviewItem}>
              <ChatPreferencePreview
                variant="emoteAnimations"
                value={previewDisableEmoteAnimations}
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
        <ScreenHeader title="Chat" subtitle="Message controls" size="medium" />

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
            title="Historical Recent Messages"
            subtitle={HISTORICAL_RECENT_MESSAGES_EXPLAINER}
            icon={{ icon: 'history', color: theme.colorDarkGreen }}
            value={showRecentMessages !== false}
            onValueChange={value => update({ showRecentMessages: value })}
          />
          <SettingsToggleRow
            title="Show Timestamps"
            subtitle="Display message timestamps inline"
            icon={{ icon: 'clock', color: theme.colorBlue }}
            value={previewContext.chatTimestamps}
            onValueChange={value =>
              handleContextToggle('chatTimestamps', value)
            }
          />
          <SettingsToggleRow
            title="Highlight Own Mentions"
            subtitle="Accent messages that mention your username"
            icon={{ icon: 'at-sign', color: theme.colorViolet }}
            value={previewContext.highlightOwnMentions}
            onValueChange={value =>
              handleContextToggle('highlightOwnMentions', value)
            }
          />
          <SettingsToggleRow
            title="Inline Reply Context"
            subtitle="Show the replied-to message above responses"
            icon={{ icon: 'corner-up-left', color: theme.colorPlum }}
            value={previewContext.showInlineReplyContext}
            onValueChange={value =>
              handleContextToggle('showInlineReplyContext', value)
            }
          />
          <SettingsToggleRow
            title="Show Jump Pill"
            subtitle="Display the unread jump-to-latest affordance"
            icon={{
              icon: 'arrow-down-circle',
              color: theme.colorAmber,
            }}
            value={previewContext.showUnreadJumpPill}
            onValueChange={value =>
              handleContextToggle('showUnreadJumpPill', value)
            }
          />
          <View style={styles.settingsPreviewItem}>
            <PreviewLabel />
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
            value={previewProviders.show7TvEmotes}
            onValueChange={value =>
              handleProviderToggle('show7TvEmotes', value)
            }
          />
          <ProviderPreviewItem
            enabled={previewProviders.show7TvEmotes}
            provider="7tv"
            variant="emotes"
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render 7TV badges next to usernames"
            value={previewProviders.show7tvBadges}
            onValueChange={value =>
              handleProviderToggle('show7tvBadges', value)
            }
          />
          <ProviderPreviewItem
            enabled={previewProviders.show7tvBadges}
            provider="7tv"
            variant="badges"
          />
        </SettingsSection>

        <SettingsSection title="BTTV">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render BetterTTV emotes in chat"
            value={previewProviders.showBttvEmotes}
            onValueChange={value =>
              handleProviderToggle('showBttvEmotes', value)
            }
          />
          <ProviderPreviewItem
            enabled={previewProviders.showBttvEmotes}
            provider="bttv"
            variant="emotes"
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render BetterTTV badges next to usernames"
            value={previewProviders.showBttvBadges}
            onValueChange={value =>
              handleProviderToggle('showBttvBadges', value)
            }
          />
          <ProviderPreviewItem
            enabled={previewProviders.showBttvBadges}
            provider="bttv"
            variant="badges"
          />
        </SettingsSection>

        <SettingsSection title="FFZ">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render FrankerFaceZ emotes in chat"
            value={previewProviders.showFFzEmotes}
            onValueChange={value =>
              handleProviderToggle('showFFzEmotes', value)
            }
          />
          <ProviderPreviewItem
            enabled={previewProviders.showFFzEmotes}
            provider="ffz"
            variant="emotes"
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render FrankerFaceZ badges next to usernames"
            value={previewProviders.showFFzBadges}
            onValueChange={value =>
              handleProviderToggle('showFFzBadges', value)
            }
          />
          <ProviderPreviewItem
            enabled={previewProviders.showFFzBadges}
            provider="ffz"
            variant="badges"
          />
        </SettingsSection>

        <SettingsSection title="Twitch">
          <SettingsToggleRow
            title="Emotes"
            subtitle="Render native Twitch emotes in chat"
            value={previewProviders.showTwitchEmotes}
            onValueChange={value =>
              handleProviderToggle('showTwitchEmotes', value)
            }
          />
          <ProviderPreviewItem
            enabled={previewProviders.showTwitchEmotes}
            provider="twitch"
            variant="emotes"
          />
          <SettingsToggleRow
            title="Badges"
            subtitle="Render native Twitch badges next to usernames"
            value={previewProviders.showTwitchBadges}
            onValueChange={value =>
              handleProviderToggle('showTwitchBadges', value)
            }
          />
          <ProviderPreviewItem
            enabled={previewProviders.showTwitchBadges}
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
            value={previewDisableEmoteAnimations}
            onValueChange={handleDisableEmoteAnimationsToggle}
          />
          <View style={styles.settingsPreviewItem}>
            <ChatPreferencePreview
              variant="emoteAnimations"
              value={previewDisableEmoteAnimations}
            />
          </View>
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
  const messageType: TextType = compact ? 'xxs' : 'caption';

  return (
    <View
      style={[styles.previewMessage, compact && styles.previewMessageCompact]}
    >
      <Text color="gray.textLow" style={styles.previewTime} type="xxs">
        {time}
      </Text>
      <Text
        color="accent.accentHover"
        type={messageType}
        weight="bold"
        style={styles.previewUsername}
      >
        {username}
      </Text>
      <Text color="gray" type={messageType} style={styles.previewText}>
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

function PreviewLabel() {
  return (
    <Text color="gray.textLow" type="xxs" weight="semibold">
      Preview
    </Text>
  );
}

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
        <Text
          color="gray"
          style={[styles.iosToggleLabel, styles.providerToggleLabel]}
          weight="semibold"
        >
          {label}
        </Text>
        <View style={styles.iosSwitchSlot}>
          <Switch
            accessibilityLabel={label}
            value={enabled}
            onValueChange={onValueChange}
          />
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
  iosToggleCopy: {
    flex: 1,
    gap: theme.space4,
    minWidth: 0,
  },
  iosToggleLabel: {
    flexShrink: 1,
    minWidth: 0,
  },
  iosToggleSubtitle: {
    flexShrink: 1,
    lineHeight: 17,
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
    flex: 1,
  },
  previewTime: {
    minWidth: 34,
  },
  previewUsername: {
    flexShrink: 0,
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
  providerToggleLabel: {
    flex: 1,
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
