import { Menu, type Icon, type Item } from '@app/components/Menu/Menu';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/Text/Text';
import { ChatPreferencePreview } from '@app/screens/Preferences/ChatPreferencesPreview';
import { ChatPreferenceMenuItem } from '@app/screens/Preferences/components/ChatPreferenceMenuItem';
import { Preferences, usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { type ReactElement, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

type PreviewSwitchKey = keyof Pick<
  Preferences,
  | 'chatTimestamps'
  | 'highlightOwnMentions'
  | 'showInlineReplyContext'
  | 'showUnreadJumpPill'
  | 'show7TvEmotes'
  | 'show7tvBadges'
  | 'showBttvEmotes'
  | 'showBttvBadges'
  | 'disableEmoteAnimations'
  | 'showFFzEmotes'
  | 'showFFzBadges'
  | 'showTwitchEmotes'
  | 'showTwitchBadges'
>;

function buildChatPreferenceSwitchItem<K extends PreviewSwitchKey>({
  description,
  icon,
  key,
  label,
  preview,
  switchValues,
  update,
}: {
  description: string;
  icon?: Icon;
  key: K;
  label: string;
  preview: ReactElement;
  switchValues: Pick<Preferences, PreviewSwitchKey>;
  update: (patch: Partial<Preferences>) => void;
}): Item {
  function SwitchPreferenceItem() {
    return (
      <ChatPreferenceMenuItem
        description={description}
        icon={icon}
        label={label}
        preview={preview}
        type="switch"
        value={Boolean(switchValues[key])}
        onSelect={value => {
          update({ [key]: value } as Pick<Preferences, K>);
        }}
      />
    );
  }

  return SwitchPreferenceItem;
}

export function ChatPreferenceScreen() {
  const {
    chatDensity,
    chatTimestamps,
    disableEmoteAnimations,
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

  const items = useMemo(() => {
    const switchValues = {
      chatTimestamps,
      highlightOwnMentions,
      showInlineReplyContext,
      showUnreadJumpPill,
      show7TvEmotes,
      show7tvBadges,
      showBttvEmotes,
      showBttvBadges,
      disableEmoteAnimations,
      showFFzEmotes,
      showFFzBadges,
      showTwitchEmotes,
      showTwitchBadges,
    } satisfies Pick<Preferences, PreviewSwitchKey>;

    return [
      'Layout',
      () => (
        <ChatPreferenceMenuItem
          description="Choose between comfortable and compact message rows"
          icon={{
            name: 'align-left',
            type: 'icon',
            color: theme.colors.gray.accent,
          }}
          label="Chat Density"
          options={[
            { label: 'Comfortable', value: 'comfortable' },
            { label: 'Compact', value: 'compact' },
          ]}
          preview={
            <ChatPreferencePreview variant="density" value={chatDensity} />
          }
          title="Select density"
          type="options"
          value={chatDensity}
          onSelect={value => {
            update({
              chatDensity: value === 'compact' ? 'compact' : 'comfortable',
            });
          }}
        />
      ),
      buildChatPreferenceSwitchItem({
        description: 'Display timestamps next to messages',
        icon: {
          name: 'clock',
          type: 'symbol',
          color: theme.colors.blue.accent,
        },
        key: 'chatTimestamps',
        label: 'Show Timestamps',
        preview: (
          <ChatPreferencePreview variant="timestamps" value={chatTimestamps} />
        ),
        switchValues,
        update,
      }),
      buildChatPreferenceSwitchItem({
        description: 'Accent messages that mention your username',
        icon: {
          name: 'at-sign',
          type: 'icon',
          color: theme.colors.violet.accent,
        },
        key: 'highlightOwnMentions',
        label: 'Highlight Own Mentions',
        preview: (
          <ChatPreferencePreview
            variant="mentions"
            value={highlightOwnMentions}
          />
        ),
        switchValues,
        update,
      }),
      buildChatPreferenceSwitchItem({
        description: 'Show reply context above chat messages',
        icon: {
          name: 'corner-up-left',
          type: 'icon',
          color: theme.colors.violet.accent,
        },
        key: 'showInlineReplyContext',
        label: 'Inline Reply Context',
        preview: (
          <ChatPreferencePreview
            variant="inlineReply"
            value={showInlineReplyContext}
          />
        ),
        switchValues,
        update,
      }),
      buildChatPreferenceSwitchItem({
        description: 'Display the jump-to-latest unread indicator',
        icon: {
          name: 'arrow-down-circle',
          type: 'icon',
          color: theme.colors.amber.accent,
        },
        key: 'showUnreadJumpPill',
        label: 'Show Jump Pill',
        preview: (
          <ChatPreferencePreview
            variant="jumpPill"
            value={showUnreadJumpPill}
          />
        ),
        switchValues,
        update,
      }),
      null,
      '7TV',
      buildChatPreferenceSwitchItem({
        description: 'Enable 7TV emotes in chat',
        icon: {
          type: 'brandIcon',
          name: 'stv',
          color: theme.colors.plum.accent,
        },
        key: 'show7TvEmotes',
        label: 'Emotes',
        preview: (
          <ChatPreferencePreview
            provider="7tv"
            value={show7TvEmotes}
            variant="providerEmotes"
          />
        ),
        switchValues,
        update,
      }),
      buildChatPreferenceSwitchItem({
        description: 'Enable 7TV badges in chat',
        icon: {
          type: 'brandIcon',
          name: 'stv',
          color: theme.colors.plum.accent,
        },
        key: 'show7tvBadges',
        label: 'Badges',
        preview: (
          <ChatPreferencePreview
            provider="7tv"
            value={show7tvBadges}
            variant="providerBadges"
          />
        ),
        switchValues,
        update,
      }),
      'BTTV',
      buildChatPreferenceSwitchItem({
        description: 'Enable BTTV emotes in chat',
        icon: {
          type: 'brandIcon',
          name: 'bttv',
          color: theme.colors.orange.accent,
        },
        key: 'showBttvEmotes',
        label: 'Emotes',
        preview: (
          <ChatPreferencePreview
            provider="bttv"
            value={showBttvEmotes}
            variant="providerEmotes"
          />
        ),
        switchValues,
        update,
      }),
      buildChatPreferenceSwitchItem({
        description: 'Enable BTTV badges in chat',
        icon: {
          type: 'brandIcon',
          name: 'bttv',
          color: theme.colors.orange.accent,
        },
        key: 'showBttvBadges',
        label: 'Badges',
        preview: (
          <ChatPreferencePreview
            provider="bttv"
            value={showBttvBadges}
            variant="providerBadges"
          />
        ),
        switchValues,
        update,
      }),
      'FFZ',
      buildChatPreferenceSwitchItem({
        description: 'Enable FFZ emotes in chat',
        key: 'showFFzEmotes',
        label: 'Emotes',
        preview: (
          <ChatPreferencePreview
            provider="ffz"
            value={showFFzEmotes}
            variant="providerEmotes"
          />
        ),
        switchValues,
        update,
      }),
      buildChatPreferenceSwitchItem({
        description: 'Enable FFZ badges in chat',
        key: 'showFFzBadges',
        label: 'Badges',
        preview: (
          <ChatPreferencePreview
            provider="ffz"
            value={showFFzBadges}
            variant="providerBadges"
          />
        ),
        switchValues,
        update,
      }),
      'Twitch',
      buildChatPreferenceSwitchItem({
        description: 'Enable Twitch emotes in chat',
        icon: {
          type: 'brandIcon',
          name: 'twitch',
          color: theme.colors.plum.accent,
        },
        key: 'showTwitchEmotes',
        label: 'Emotes',
        preview: (
          <ChatPreferencePreview
            provider="twitch"
            value={showTwitchEmotes}
            variant="providerEmotes"
          />
        ),
        switchValues,
        update,
      }),
      buildChatPreferenceSwitchItem({
        description: 'Enable Twitch badges in chat',
        icon: {
          type: 'brandIcon',
          name: 'twitch',
          color: theme.colors.plum.accent,
        },
        key: 'showTwitchBadges',
        label: 'Badges',
        preview: (
          <ChatPreferencePreview
            provider="twitch"
            value={showTwitchBadges}
            variant="providerBadges"
          />
        ),
        switchValues,
        update,
      }),
      null,
      buildChatPreferenceSwitchItem({
        description: 'Show static versions of animated emotes',
        icon: {
          name: 'circle-off',
          type: 'icon',
          color: theme.colors.red.accent,
        },
        key: 'disableEmoteAnimations',
        label: 'Disable Emote Animations',
        preview: (
          <View style={styles.preferenceNote}>
            <Text color="gray.textLow" type="xs">
              Animated Twitch, BTTV, FFZ, and 7TV emotes will render as still
              images in chat.
            </Text>
          </View>
        ),
        switchValues,
        update,
      }),
    ] satisfies Item[];
  }, [
    chatDensity,
    chatTimestamps,
    disableEmoteAnimations,
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
  ]);

  return (
    <View style={styles.container}>
      <Menu
        header={
          <ScreenHeader
            title="Chat"
            subtitle="Preview each setting where it changes the chat UI"
            size="medium"
          />
        }
        items={items}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
  preferenceNote: {
    justifyContent: 'center',
    minHeight: theme.spacing['4xl'],
  },
});
