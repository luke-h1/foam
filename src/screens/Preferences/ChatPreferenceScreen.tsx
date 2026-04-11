import { Menu, type Icon, type Item } from '@app/components/Menu/Menu';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
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
  | 'showFFzEmotes'
  | 'showFFzBadges'
  | 'showTwitchEmotes'
  | 'showTwitchBadges'
>;

export function ChatPreferenceScreen() {
  const {
    chatDensity,
    chatTimestamps,
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
      showFFzEmotes,
      showFFzBadges,
      showTwitchEmotes,
      showTwitchBadges,
    } satisfies Pick<Preferences, PreviewSwitchKey>;

    function buildSwitchItem<K extends PreviewSwitchKey>({
      description,
      icon,
      key,
      label,
      preview,
    }: {
      description: string;
      icon?: Icon;
      key: K;
      label: string;
      preview: ReactElement;
    }): Item {
      return () => (
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
          preview={<ChatPreferencePreview variant="density" value={chatDensity} />}
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
      buildSwitchItem({
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
      }),
      buildSwitchItem({
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
      }),
      buildSwitchItem({
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
      }),
      buildSwitchItem({
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
      }),
      null,
      '7TV',
      buildSwitchItem({
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
      }),
      buildSwitchItem({
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
      }),
      'BTTV',
      buildSwitchItem({
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
      }),
      buildSwitchItem({
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
      }),
      'FFZ',
      buildSwitchItem({
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
      }),
      buildSwitchItem({
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
      }),
      'Twitch',
      buildSwitchItem({
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
      }),
      buildSwitchItem({
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
      }),
    ] satisfies Item[];
  }, [
    chatDensity,
    chatTimestamps,
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
});
