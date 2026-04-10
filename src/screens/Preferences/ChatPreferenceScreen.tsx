import { Menu, MenuItem } from '@app/components/Menu/Menu';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { ChatPreferencePreview } from '@app/screens/Preferences/ChatPreferencesPreview';
import { Preferences, usePreferences } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

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

    function buildSwitchItem<K extends PreviewSwitchKey>({
      description,
      icon,
      key,
      label,
      preview,
    }: {
      description: string;
      icon?: MenuItem['icon'];
      key: K;
      label: string;
      preview: React.JSX.Element;
    }) {
      return {
        description,
        icon,
        label,
        onSelect: (value: boolean) => {
          update({ [key]: value } as Pick<Preferences, K>);
        },
        preview,
        type: 'switch',
        value: Boolean(
          {
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
          }[key],
        ),
      } satisfies MenuItem;
    }

    return [
      {
        icon: {
          name: 'align-left',
          type: 'icon',
          color: theme.colors.gray.accent,
        },
        label: 'Chat Density',
        description: 'Choose between comfortable and compact message rows',
        onSelect: (value: string) => {
          update({
            chatDensity: value === 'compact' ? 'compact' : 'comfortable',
          });
        },
        options: [
          { label: 'Comfortable', value: 'comfortable' },
          { label: 'Compact', value: 'compact' },
        ],
        preview: (
          <ChatPreferencePreview variant="density" value={chatDensity} />
        ),
        type: 'options',
        value: chatDensity,
      },
      buildSwitchItem({
        icon: {
          name: 'clock',
          type: 'symbol',
          color: theme.colors.blue.accent,
        },
        key: 'chatTimestamps',
        label: 'Show Timestamps',
        description: 'Display timestamps next to messages',
        preview: (
          <ChatPreferencePreview variant="timestamps" value={chatTimestamps} />
        ),
      }),
      buildSwitchItem({
        icon: {
          name: 'at-sign',
          type: 'icon',
          color: theme.colors.violet.accent,
        },
        key: 'highlightOwnMentions',
        label: 'Highlight Own Mentions',
        description: 'Accent messages that mention your username',
        preview: (
          <ChatPreferencePreview
            variant="mentions"
            value={highlightOwnMentions}
          />
        ),
      }),
      buildSwitchItem({
        icon: {
          name: 'corner-up-left',
          type: 'icon',
          color: theme.colors.violet.accent,
        },
        key: 'showInlineReplyContext',
        label: 'Inline Reply Context',
        description: 'Show reply context above chat messages',
        preview: (
          <ChatPreferencePreview
            variant="inlineReply"
            value={showInlineReplyContext}
          />
        ),
      }),
      buildSwitchItem({
        icon: {
          name: 'arrow-down-circle',
          type: 'icon',
          color: theme.colors.amber.accent,
        },
        key: 'showUnreadJumpPill',
        label: 'Show Jump Pill',
        description: 'Display the jump-to-latest unread indicator',
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
        icon: {
          type: 'brandIcon',
          name: 'stv',
          color: theme.colors.plum.accent,
        },
        key: 'show7TvEmotes',
        label: 'Emotes',
        description: 'Enable 7TV emotes in chat',
        preview: (
          <ChatPreferencePreview
            provider="7tv"
            value={show7TvEmotes}
            variant="providerEmotes"
          />
        ),
      }),
      buildSwitchItem({
        icon: {
          type: 'brandIcon',
          name: 'stv',
          color: theme.colors.plum.accent,
        },
        key: 'show7tvBadges',
        label: 'Badges',
        description: 'Enable 7TV badges in chat',
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
        icon: {
          type: 'brandIcon',
          name: 'bttv',
          color: theme.colors.orange.accent,
        },
        key: 'showBttvEmotes',
        label: 'Emotes',
        description: 'Enable BTTV emotes in chat',
        preview: (
          <ChatPreferencePreview
            provider="bttv"
            value={showBttvEmotes}
            variant="providerEmotes"
          />
        ),
      }),
      buildSwitchItem({
        icon: {
          type: 'brandIcon',
          name: 'bttv',
          color: theme.colors.orange.accent,
        },
        key: 'showBttvBadges',
        label: 'Badges',
        description: 'Enable BTTV badges in chat',
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
        key: 'showFFzEmotes',
        label: 'Emotes',
        description: 'Enable FFZ emotes in chat',
        preview: (
          <ChatPreferencePreview
            provider="ffz"
            value={showFFzEmotes}
            variant="providerEmotes"
          />
        ),
      }),
      buildSwitchItem({
        key: 'showFFzBadges',
        label: 'Badges',
        description: 'Enable FFZ badges in chat',
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
        icon: {
          type: 'brandIcon',
          name: 'twitch',
          color: theme.colors.plum.accent,
        },
        key: 'showTwitchEmotes',
        label: 'Emotes',
        description: 'Enable Twitch emotes in chat',
        preview: (
          <ChatPreferencePreview
            provider="twitch"
            value={showTwitchEmotes}
            variant="providerEmotes"
          />
        ),
      }),
      buildSwitchItem({
        icon: {
          type: 'brandIcon',
          name: 'twitch',
          color: theme.colors.plum.accent,
        },
        key: 'showTwitchBadges',
        label: 'Badges',
        description: 'Enable Twitch badges in chat',
        preview: (
          <ChatPreferencePreview
            provider="twitch"
            value={showTwitchBadges}
            variant="providerBadges"
          />
        ),
      }),
    ] satisfies (MenuItem | string | null)[];
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
