import { Menu, MenuItem } from '@app/components/Menu';
import { Screen } from '@app/components/Screen';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { usePreferences } from '@app/store/preferenceStore';
import { useMemo } from 'react';
import { useUnistyles } from 'react-native-unistyles';

export function ChatPreferenceScreen() {
  const {
    chatTimestamps,
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
  const { theme } = useUnistyles();

  const items = useMemo(() => {
    return [
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
      null,
      '7TV',
      {
        icon: {
          type: 'icon',
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
          type: 'icon',
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
          type: 'icon',
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
          type: 'icon',
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
        icon: {
          type: 'icon',
          name: 'ffz',
          color: theme.colors.green.accent,
        },
        label: 'Emotes',
        description: 'Enable FFZ emotes in chat',
        onSelect: (value: boolean) => {
          update({ showFFzEmotes: value });
        },
        type: 'switch',
        value: showFFzEmotes,
      },
      {
        icon: {
          type: 'icon',
          name: 'ffz',
          color: theme.colors.green.accent,
        },
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
          type: 'icon',
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
          type: 'icon',
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
    chatTimestamps,
    show7TvEmotes,
    show7tvBadges,
    showBttvEmotes,
    showBttvBadges,
    showFFzEmotes,
    showFFzBadges,
    showTwitchEmotes,
    showTwitchBadges,
    theme.colors,
    update,
  ]);

  return (
    <Screen safeAreaEdges={[]} preset="fixed">
      <Menu
        header={<ScreenHeader title="Chat" subtitle="" size="medium" />}
        items={items}
      />
    </Screen>
  );
}
