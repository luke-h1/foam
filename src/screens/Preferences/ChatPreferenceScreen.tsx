import { BodyScrollView } from '@app/components/BodyScrollView/BodyScrollView';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import * as Form from '@app/components/Form/Form';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Image } from '@app/components/Image/Image';
import {
  SettingsSection,
  SettingsToggleRow,
} from '@app/components/SettingsSection/SettingsSection';
import { Switch } from '@app/components/Switch/Switch';
import { Text, type TextType } from '@app/components/ui/Text/Text';
import { usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import type { SanitisedEmote } from '@app/types/emote';
import { useObservable, useSelector } from '@legendapp/state/react';
import {
  EMOJI_STYLE_OPTIONS,
  getEmojiEmotes,
} from '@app/utils/emoji/emojiEmotes';
import { ChatPreferencePreview } from './ChatPreferencesPreview';
import { ChatPreferenceSegmentedTrailing } from './ChatPreferenceSegmentedTrailing';
import { ChatProviderPreferenceSections } from './ChatProviderPreferenceSections';
import { ChatPreferenceSegmentedSettingsRow } from './ChatPreferenceSettingsRows';
import type { SymbolViewProps } from 'expo-symbols';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';

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
type ContextPreviewKey = keyof ContextPreviewValue;
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
type ProviderPreviewKey = keyof ProviderPreviewValue;
type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';
type ProviderPreviewVariant = 'badges' | 'emotes';

const CONTEXT_PREVIEW_KEYS = [
  'chatTimestamps',
  'highlightOwnMentions',
  'showInlineReplyContext',
  'showUnreadJumpPill',
] as const satisfies readonly ContextPreviewKey[];

const PROVIDER_PREVIEW_KEYS = [
  'show7TvEmotes',
  'show7tvBadges',
  'showBttvEmotes',
  'showBttvBadges',
  'showFFzEmotes',
  'showFFzBadges',
  'showTwitchEmotes',
  'showTwitchBadges',
] as const satisfies readonly ProviderPreviewKey[];

const CONTEXT_TOGGLE_ROWS = [
  {
    key: 'chatTimestamps',
    label: 'Show Timestamps',
    subtitle: 'Display message timestamps inline',
    icon: { icon: 'clock', color: theme.colorBlue },
  },
  {
    key: 'highlightOwnMentions',
    label: 'Highlight Own Mentions',
    subtitle: 'Accent messages that mention your username',
    icon: { icon: 'at', color: theme.colorViolet },
  },
  {
    key: 'showInlineReplyContext',
    label: 'Inline Reply Context',
    subtitle: 'Show the replied-to message above responses',
    icon: { icon: 'arrowshape.turn.up.left', color: theme.colorPlum },
  },
  {
    key: 'showUnreadJumpPill',
    label: 'Show Jump Pill',
    subtitle: 'Display the unread jump-to-latest affordance',
    icon: { icon: 'arrow.down.circle', color: theme.colorAmber },
  },
] as const satisfies readonly {
  icon: { color: string; icon: SymbolViewProps['name'] };
  key: ContextPreviewKey;
  label: string;
  subtitle: string;
}[];

const PROVIDER_PREFERENCE_SECTIONS = [
  {
    title: '7TV',
    provider: '7tv',
    emotes: {
      key: 'show7TvEmotes',
      subtitle: 'Render 7TV emotes in chat',
    },
    badges: {
      key: 'show7tvBadges',
      subtitle: 'Render 7TV badges next to usernames',
    },
  },
  {
    title: 'BTTV',
    provider: 'bttv',
    emotes: {
      key: 'showBttvEmotes',
      subtitle: 'Render BetterTTV emotes in chat',
    },
    badges: {
      key: 'showBttvBadges',
      subtitle: 'Render BetterTTV badges next to usernames',
    },
  },
  {
    title: 'FFZ',
    provider: 'ffz',
    emotes: {
      key: 'showFFzEmotes',
      subtitle: 'Render FrankerFaceZ emotes in chat',
    },
    badges: {
      key: 'showFFzBadges',
      subtitle: 'Render FrankerFaceZ badges next to usernames',
    },
  },
  {
    title: 'Twitch',
    provider: 'twitch',
    emotes: {
      key: 'showTwitchEmotes',
      subtitle: 'Render native Twitch emotes in chat',
    },
    badges: {
      key: 'showTwitchBadges',
      subtitle: 'Render native Twitch badges next to usernames',
    },
  },
] as const satisfies readonly {
  badges: { key: ProviderPreviewKey; subtitle: string };
  emotes: { key: ProviderPreviewKey; subtitle: string };
  provider: PreviewProvider;
  title: string;
}[];

function samePreviewValues<T extends object>(
  left: T,
  right: T,
  keys: readonly (keyof T)[],
): boolean {
  return keys.every(key => left[key] === right[key]);
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
        <Text color='gray' style={styles.iosToggleLabel} weight='semibold'>
          {label}
        </Text>
        {subtitle ? (
          <Text color='gray.textLow' style={styles.iosToggleSubtitle} type='xs'>
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
    showAlternatingChatRows,
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
  const previewDensity$ = useObservable(chatDensity);
  const previewAlternatingRows$ = useObservable(showAlternatingChatRows);
  const previewEmojiStyle$ = useObservable(emojiStyle);
  const previewContext$ = useObservable<ContextPreviewValue>({
    chatTimestamps,
    highlightOwnMentions,
    showInlineReplyContext,
    showUnreadJumpPill,
  });
  const previewDisableEmoteAnimations$ = useObservable(disableEmoteAnimations);
  const previewProviders$ = useObservable<ProviderPreviewValue>({
    show7TvEmotes,
    show7tvBadges,
    showBttvEmotes,
    showBttvBadges,
    showFFzEmotes,
    showFFzBadges,
    showTwitchEmotes,
    showTwitchBadges,
  });
  const previewDensity = useSelector(previewDensity$);
  const previewAlternatingRows = useSelector(previewAlternatingRows$);
  const previewEmojiStyle = useSelector(previewEmojiStyle$);
  const previewContext = useSelector(previewContext$);
  const previewDisableEmoteAnimations = useSelector(
    previewDisableEmoteAnimations$,
  );
  const previewProviders = useSelector(previewProviders$);
  const densityIndex = previewDensity === 'compact' ? 1 : 0;
  const emojiLabels = EMOJI_STYLE_OPTIONS.map(option => option.label);
  const emojiIndex = Math.max(
    0,
    EMOJI_STYLE_OPTIONS.findIndex(option => option.value === previewEmojiStyle),
  );
  const emojiPreviewEmotes = (() => {
    const emotes = getEmojiEmotes(previewEmojiStyle);
    const preview = EMOJI_PREVIEW_SHORTCODES.flatMap(shortcode => {
      const emote = emotes.find(item => item.name === shortcode);
      return emote ? [emote] : [];
    });

    if (preview.length > 0) {
      return preview;
    }

    return emotes.slice(0, 3);
  })();

  useEffect(() => {
    previewDensity$.set(chatDensity);
  }, [chatDensity, previewDensity$]);

  useEffect(() => {
    previewAlternatingRows$.set(showAlternatingChatRows);
  }, [previewAlternatingRows$, showAlternatingChatRows]);

  useEffect(() => {
    previewEmojiStyle$.set(emojiStyle);
  }, [emojiStyle, previewEmojiStyle$]);

  useEffect(() => {
    const nextContext = {
      chatTimestamps,
      highlightOwnMentions,
      showInlineReplyContext,
      showUnreadJumpPill,
    };
    previewContext$.set(previous =>
      samePreviewValues(previous, nextContext, CONTEXT_PREVIEW_KEYS)
        ? previous
        : nextContext,
    );
  }, [
    chatTimestamps,
    highlightOwnMentions,
    previewContext$,
    showInlineReplyContext,
    showUnreadJumpPill,
  ]);

  useEffect(() => {
    previewDisableEmoteAnimations$.set(disableEmoteAnimations);
  }, [disableEmoteAnimations, previewDisableEmoteAnimations$]);

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
    previewProviders$.set(previous =>
      samePreviewValues(previous, nextProviders, PROVIDER_PREVIEW_KEYS)
        ? previous
        : nextProviders,
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
    previewProviders$,
  ]);

  const handleContextToggle = (key: ContextPreviewKey, value: boolean) => {
    previewContext$.set(previous =>
      previous[key] === value
        ? previous
        : {
            ...previous,
            [key]: value,
          },
    );
    update({ [key]: value });
  };

  const handleProviderToggle = (key: ProviderPreviewKey, value: boolean) => {
    previewProviders$.set(previous =>
      previous[key] === value
        ? previous
        : {
            ...previous,
            [key]: value,
          },
    );
    update({ [key]: value });
  };

  const handleDisableEmoteAnimationsToggle = (value: boolean) => {
    previewDisableEmoteAnimations$.set(value);
    update({ disableEmoteAnimations: value });
  };

  const handleDensitySelect = (nextDensity: 'comfortable' | 'compact') => {
    previewDensity$.set(nextDensity);
    update({
      chatDensity: nextDensity,
    });
  };

  const handleDensityChange = (event: SegmentedControlChangeEvent) => {
    const nextDensity =
      DENSITY_OPTIONS[event.nativeEvent.selectedSegmentIndex]?.value;

    if (!nextDensity) {
      return;
    }

    handleDensitySelect(nextDensity);
  };

  const handleDensityValueChange = (value: string) => {
    const selected = DENSITY_OPTIONS.find(option => option.label === value);

    if (!selected) {
      return;
    }

    handleDensitySelect(selected.value);
  };

  const handleAlternatingRowsToggle = (value: boolean) => {
    previewAlternatingRows$.set(value);
    update({ showAlternatingChatRows: value });
  };

  const handleEmojiStyleChange = (value: string) => {
    const option = EMOJI_STYLE_OPTIONS.find(option => option.label === value);

    if (!option) {
      return;
    }

    previewEmojiStyle$.set(option.value);
    update({ emojiStyle: option.value });
  };

  const handleEmojiStyleChangeByIndex = (
    event: SegmentedControlChangeEvent,
  ) => {
    const option = EMOJI_STYLE_OPTIONS[event.nativeEvent.selectedSegmentIndex];

    if (!option) {
      return;
    }

    previewEmojiStyle$.set(option.value);
    update({ emojiStyle: option.value });
  };

  useScrollToTop(scrollRef);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BodyScrollView
          contentInsetAdjustmentBehavior='automatic'
          contentContainerStyle={styles.iosContent}
        >
          <Form.Section title='Layout'>
            <Form.FormItem style={styles.iosControlItem}>
              <View style={styles.iosControlBody}>
                <View style={styles.controlCopy}>
                  <Text color='gray' weight='semibold'>
                    Message Density
                  </Text>
                  <Text color='gray.textLow' type='xs'>
                    {previewDensity === 'compact'
                      ? 'Tighter rows for faster scanning'
                      : 'Comfy rows with more breathing space'}
                  </Text>
                </View>
                <ChatPreferenceSegmentedTrailing
                  onChange={handleDensityChange}
                  onValueChange={handleDensityValueChange}
                  selectedIndex={densityIndex}
                  values={DENSITY_LABELS}
                  variant='ios'
                />
                <DensityPreview density={previewDensity} />
              </View>
            </Form.FormItem>
            <IosToggleRow
              custom
              label='Alternating Rows'
              subtitle='Add subtle striping between chat lines'
              value={previewAlternatingRows}
              onValueChange={handleAlternatingRowsToggle}
            />
            <View style={styles.iosPreviewItem}>
              <PreviewLabel />
              <ChatPreferencePreview
                variant='alternatingRows'
                value={previewAlternatingRows}
              />
            </View>
          </Form.Section>

          <Form.Section title='Emoji Style'>
            <Form.FormItem style={styles.iosControlItem}>
              <View style={styles.iosControlBody}>
                <View style={styles.controlCopy}>
                  <Text color='gray' weight='semibold'>
                    Emoji Set
                  </Text>
                  <Text color='gray.textLow' type='xs'>
                    Changes emoji images in existing chat messages
                  </Text>
                </View>
                <ChatPreferenceSegmentedTrailing
                  onChange={handleEmojiStyleChangeByIndex}
                  onValueChange={handleEmojiStyleChange}
                  selectedIndex={emojiIndex}
                  values={emojiLabels}
                  variant='ios'
                />
                <EmojiStylePreview emotes={emojiPreviewEmotes} />
              </View>
            </Form.FormItem>
          </Form.Section>

          <Form.Section title='Context'>
            <IosToggleRow
              custom
              label='Historical Recent Messages'
              subtitle={HISTORICAL_RECENT_MESSAGES_EXPLAINER}
              value={showRecentMessages !== false}
              onValueChange={value => update({ showRecentMessages: value })}
            />
            {CONTEXT_TOGGLE_ROWS.map(row => (
              <IosToggleRow
                custom
                key={row.key}
                label={row.label}
                value={previewContext[row.key]}
                onValueChange={value => handleContextToggle(row.key, value)}
              />
            ))}
            <View style={styles.iosPreviewItem}>
              <PreviewLabel />
              <ChatPreferencePreview variant='context' value={previewContext} />
            </View>
          </Form.Section>

          {PROVIDER_PREFERENCE_SECTIONS.map(section => (
            <Form.Section key={section.title} title={section.title}>
              <ProviderTogglePreviewItem
                custom
                enabled={previewProviders[section.emotes.key]}
                label='Emotes'
                onValueChange={value =>
                  handleProviderToggle(section.emotes.key, value)
                }
                provider={section.provider}
                variant='emotes'
              />
              <ProviderTogglePreviewItem
                custom
                enabled={previewProviders[section.badges.key]}
                label='Badges'
                onValueChange={value =>
                  handleProviderToggle(section.badges.key, value)
                }
                provider={section.provider}
                variant='badges'
              />
            </Form.Section>
          ))}

          <Form.Section title='Media'>
            <IosToggleRow
              custom
              label='Disable Emote Animations'
              value={previewDisableEmoteAnimations}
              onValueChange={handleDisableEmoteAnimationsToggle}
            />
            <View style={styles.iosPreviewItem}>
              <ChatPreferencePreview
                variant='emoteAnimations'
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
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ScreenHeader title='Chat' subtitle='Message controls' size='medium' />

        <SettingsSection title='Layout'>
          <ChatPreferenceSegmentedSettingsRow
            icon={{ icon: 'list.bullet', color: theme.colorGrey }}
            onChange={handleDensityChange}
            onValueChange={handleDensityValueChange}
            selectedIndex={densityIndex}
            subtitle={
              previewDensity === 'compact'
                ? 'Tighter rows for faster scanning'
                : 'Roomier rows with more breathing space'
            }
            title='Message Density'
            values={DENSITY_LABELS}
          />
          <View style={styles.settingsPreviewItem}>
            <DensityPreview density={previewDensity} />
          </View>
          <SettingsToggleRow
            title='Alternating Rows'
            subtitle='Add subtle striping between chat lines'
            icon={{ icon: 'line.3.horizontal', color: theme.colorBlue }}
            value={previewAlternatingRows}
            onValueChange={handleAlternatingRowsToggle}
          />
          <View style={styles.settingsPreviewItem}>
            <ChatPreferencePreview
              variant='alternatingRows'
              value={previewAlternatingRows}
            />
          </View>
        </SettingsSection>

        <SettingsSection title='Emoji Style'>
          <ChatPreferenceSegmentedSettingsRow
            icon={{ icon: 'face.smiling', color: theme.colorAmber }}
            onChange={handleEmojiStyleChangeByIndex}
            onValueChange={handleEmojiStyleChange}
            selectedIndex={emojiIndex}
            subtitle='Changes emoji images in existing chat messages'
            title='Emoji Set'
            values={emojiLabels}
          />
          <View style={styles.settingsPreviewItem}>
            <EmojiStylePreview emotes={emojiPreviewEmotes} />
          </View>
        </SettingsSection>

        <SettingsSection title='Context'>
          <SettingsToggleRow
            title='Historical Recent Messages'
            subtitle={HISTORICAL_RECENT_MESSAGES_EXPLAINER}
            icon={{
              icon: 'clock.arrow.circlepath',
              color: theme.colorDarkGreen,
            }}
            value={showRecentMessages !== false}
            onValueChange={value => update({ showRecentMessages: value })}
          />
          {CONTEXT_TOGGLE_ROWS.map(row => (
            <SettingsToggleRow
              key={row.key}
              title={row.label}
              subtitle={row.subtitle}
              icon={row.icon}
              value={previewContext[row.key]}
              onValueChange={value => handleContextToggle(row.key, value)}
            />
          ))}
          <View style={styles.settingsPreviewItem}>
            <PreviewLabel />
            <View style={styles.previewSpacer}>
              <ChatPreferencePreview variant='context' value={previewContext} />
            </View>
          </View>
        </SettingsSection>

        <ChatProviderPreferenceSections
          previewProviders={previewProviders}
          onProviderToggle={handleProviderToggle}
          ProviderPreviewItem={ProviderPreviewItem}
        />

        <SettingsSection
          title='Media'
          footer={
            <Text color='gray.textLow' type='xs'>
              Animated Twitch, BTTV, FFZ, and 7TV emotes will render as still
              images when this is enabled.
            </Text>
          }
        >
          <SettingsToggleRow
            title='Disable Emote Animations'
            subtitle='Prefer static emote rendering'
            icon={{ icon: 'slash.circle', color: theme.colorRed }}
            value={previewDisableEmoteAnimations}
            onValueChange={handleDisableEmoteAnimationsToggle}
          />
          <View style={styles.settingsPreviewItem}>
            <ChatPreferencePreview
              variant='emoteAnimations'
              value={previewDisableEmoteAnimations}
            />
          </View>
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

const DensityPreview = function DensityPreview({
  density,
}: {
  density: 'comfortable' | 'compact';
}) {
  const compact = density === 'compact';

  return (
    <View style={[styles.previewPanel, compact && styles.previewPanelCompact]}>
      <PreviewMessage
        compact={compact}
        time='12:42'
        username='needlework'
        message='linework healed clean'
      />
      <PreviewMessage
        compact={compact}
        time='12:43'
        username='inkmod'
        message='shading pass is ready'
      />
    </View>
  );
};

const PreviewMessage = function PreviewMessage({
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
      <Text color='gray.textLow' style={styles.previewTime} type='xxs'>
        {time}
      </Text>
      <Text
        color='accent.accentHover'
        type={messageType}
        weight='bold'
        style={styles.previewUsername}
      >
        {username}
      </Text>
      <Text color='gray' type={messageType} style={styles.previewText}>
        {message}
      </Text>
    </View>
  );
};

const EmojiStylePreview = function EmojiStylePreview({
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
              cachePolicy='memory-disk'
              contentFit='contain'
              source={{ uri: emote.url }}
              style={styles.emojiImage}
              transition={0}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

function PreviewLabel() {
  return (
    <Text color='gray.textLow' type='xxs' weight='semibold'>
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
  provider: PreviewProvider;
  variant: ProviderPreviewVariant;
}) {
  return (
    <View style={styles.providerTogglePreviewItem}>
      <View style={styles.providerToggleHeader}>
        <Text
          color='gray'
          style={[styles.iosToggleLabel, styles.providerToggleLabel]}
          weight='semibold'
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

const ProviderPreviewItem = function ProviderPreviewItem({
  enabled,
  provider,
  variant,
}: {
  enabled: boolean;
  provider: PreviewProvider;
  variant: ProviderPreviewVariant;
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
};

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
