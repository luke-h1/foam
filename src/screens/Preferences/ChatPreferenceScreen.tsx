import { Menu, MenuItem } from '@app/components/Menu/Menu';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { usePreferences } from '@app/store/preferenceStore';
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
        type: 'options',
        value: chatDensity,
      },
      {
        icon: {
          name: 'clock',
          type: 'symbol',
          color: theme.colors.blue.accent,
        },
        label: 'Show Timestamps',
        description: 'Display timestamps next to messages',
        onSelect: (value: boolean) => {
          update({ chatTimestamps: value });
        },
        type: 'switch',
        value: chatTimestamps,
      },
      {
        icon: {
          name: 'at-sign',
          type: 'icon',
          color: theme.colors.violet.accent,
        },
        label: 'Highlight Own Mentions',
        description: 'Accent messages that mention your username',
        onSelect: (value: boolean) => {
          update({ highlightOwnMentions: value });
        },
        type: 'switch',
        value: highlightOwnMentions,
      },
      {
        icon: {
          name: 'corner-up-left',
          type: 'icon',
          color: theme.colors.violet.accent,
        },
        label: 'Inline Reply Context',
        description: 'Show reply context above chat messages',
        onSelect: (value: boolean) => {
          update({ showInlineReplyContext: value });
        },
        type: 'switch',
        value: showInlineReplyContext,
      },
      {
        icon: {
          name: 'arrow-down-circle',
          type: 'icon',
          color: theme.colors.amber.accent,
        },
        label: 'Show Jump Pill',
        description: 'Display the jump-to-latest unread indicator',
        onSelect: (value: boolean) => {
          update({ showUnreadJumpPill: value });
        },
        type: 'switch',
        value: showUnreadJumpPill,
      },
      null,
      '7TV',
      {
        icon: {
          type: 'brandIcon',
          name: 'stv',
          color: theme.colors.plum.accent,
        },
        label: 'Emotes',
        description: 'Enable 7TV emotes in chat',
        onSelect: (value: boolean) => {
          update({ show7TvEmotes: value });
        },
        type: 'switch',
        value: show7TvEmotes,
      },
      {
        icon: {
          type: 'brandIcon',
          name: 'stv',
          color: theme.colors.plum.accent,
        },
        label: 'Badges',
        description: 'Enable 7TV badges in chat',
        onSelect: (value: boolean) => {
          update({ show7tvBadges: value });
        },
        type: 'switch',
        value: show7tvBadges,
      },

      'BTTV',
      {
        icon: {
          type: 'brandIcon',
          name: 'bttv',
          color: theme.colors.orange.accent,
        },
        label: 'Emotes',
        description: 'Enable BTTV emotes in chat',
        onSelect: (value: boolean) => {
          update({ showBttvEmotes: value });
        },
        type: 'switch',
        value: showBttvEmotes,
      },
      {
        icon: {
          type: 'brandIcon',
          name: 'bttv',
          color: theme.colors.orange.accent,
        },
        label: 'Badges',
        description: 'Enable BTTV badges in chat',
        onSelect: (value: boolean) => {
          update({ showBttvBadges: value });
        },
        type: 'switch',
        value: showBttvBadges,
      },
      'FFZ',
      {
        label: 'Emotes',
        description: 'Enable FFZ emotes in chat',
        onSelect: (value: boolean) => {
          update({ showFFzEmotes: value });
        },
        type: 'switch',
        value: showFFzEmotes,
      },
      {
        label: 'Badges',
        description: 'Enable FFZ badges in chat',
        onSelect: (value: boolean) => {
          update({ showFFzBadges: value });
        },
        type: 'switch',
        value: showFFzBadges,
      },
      'Twitch',
      {
        icon: {
          type: 'brandIcon',
          name: 'twitch',
          color: theme.colors.plum.accent,
        },
        label: 'Emotes',
        description: 'Enable Twitch emotes in chat',
        onSelect: (value: boolean) => {
          update({ showTwitchEmotes: value });
        },
        type: 'switch',
        value: showTwitchEmotes,
      },
      {
        icon: {
          type: 'brandIcon',
          name: 'twitch',
          color: theme.colors.plum.accent,
        },
        label: 'Badges',
        description: 'Enable Twitch badges in chat',
        onSelect: (value: boolean) => {
          update({ showTwitchBadges: value });
        },
        type: 'switch',
        value: showTwitchBadges,
      },
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
        header={<ScreenHeader title="Chat" subtitle="" size="medium" />}
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
