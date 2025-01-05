import { MESSAGES_LIMIT, Options, TIMESTAMP_FORMAT } from './options';

type OptionsComponentInput = {
  type: 'input';
  value: string;
};
type OptionsComponentSwitch = {
  type: 'switch';
  value: boolean;
};
type OptionsComponentSelect = {
  type: 'select';
  value: string | number;
  options: string[] | readonly string[];
};
export type OptionsComponent =
  | OptionsComponentInput
  | OptionsComponentSwitch
  | OptionsComponentSelect;
export type OptionsItem<S extends keyof Options> = {
  name: keyof Options[S];
  title: string;
  description: string;
  component: OptionsComponent;
};
export type OptionsCategory<S extends keyof Options = keyof Options> = {
  id: S;
  title: string;
  items: OptionsItem<S>[];
};

const createOptionsCategories = (options: Options): OptionsCategory[] => [
  {
    id: 'ui',
    title: 'UI',
    items: [
      {
        name: 'timestampFormat',
        title: 'Timestamps',
        description: '',
        component: {
          type: 'select',
          value: options.ui.timestampFormat,
          options: TIMESTAMP_FORMAT,
        },
      } as OptionsItem<'ui'>,
      {
        name: 'messagesLimit',
        title: 'Messages Limit',
        description: '',
        component: {
          type: 'select',
          value: options.ui.messagesLimit,
          options: MESSAGES_LIMIT,
        },
      } as OptionsItem<'ui'>,
      {
        name: 'splitChat',
        title: 'Split Chat',
        description: '',
        component: {
          type: 'switch',
          value: options.ui.splitChat,
        },
      } as OptionsItem<'ui'>,
    ] as OptionsCategory['items'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    items: [
      {
        name: 'mentions',
        title: 'Play a sound on highlights',
        description: 'Plays a sound for messages directed at you',
        component: {
          type: 'switch',
          value: options.notifications.mentions,
        },
      } as OptionsItem<'notifications'>,
      {
        name: 'highlightKeywords',
        title: 'Set Highlight Keywords',
        description: 'Highlight certain words or phrases in your chat',
        component: {
          type: 'input',
          value: options.notifications.highlightKeywords,
        },
      } as OptionsItem<'notifications'>,
    ] as OptionsCategory['items'],
  },
  {
    id: 'recentMessages',
    title: 'Chat History',
    items: [
      {
        name: 'load',
        title: 'Load Chat History',
        description: '',
        component: {
          type: 'switch',
          value: options.recentMessages.load,
        },
      } as OptionsItem<'recentMessages'>,
    ] as OptionsCategory['items'],
  },
  {
    id: 'twitch',
    title: 'Twitch',
    items: [
      {
        name: 'cards',
        title: 'Show Twitch clips and vods',
        description: 'Show previews for Twitch clips and vods in the chat',
        component: {
          type: 'switch',
          value: options.twitch.cards,
        },
      } as OptionsItem<'twitch'>,
      // {
      //   name: 'animatedEmotes',
      //   title: 'Animated Emotes',
      //   description: '',
      //   component: {
      //     type: 'switch',
      //     value: options.twitch.animatedEmotes,
      //   },
      // } as OptionsItem<'twitch'>,
    ] as OptionsCategory['items'],
  },
  {
    id: 'bttv',
    title: 'BetterTTV',
    items: [
      {
        name: 'emotes',
        title: 'Show Emotes',
        description: '',
        component: {
          type: 'switch',
          value: options.bttv.emotes,
        },
      } as OptionsItem<'bttv'>,
      {
        name: 'badges',
        title: 'Show Badges',
        description: '',
        component: {
          type: 'switch',
          value: options.bttv.badges,
        },
      } as OptionsItem<'bttv'>,
    ] as OptionsCategory['items'],
  },
  {
    id: 'ffz',
    title: 'FrankerFaceZ',
    items: [
      {
        name: 'emotes',
        title: 'Show Emotes',
        description: '',
        component: {
          type: 'switch',
          value: options.ffz.emotes,
        },
      } as OptionsItem<'ffz'>,
      {
        name: 'emoji',
        title: 'Show Emoji',
        description: '',
        component: {
          type: 'switch',
          value: options.ffz.emoji,
        },
      } as OptionsItem<'ffz'>,
      {
        name: 'badges',
        title: 'Show Emotes',
        description: '',
        component: {
          type: 'switch',
          value: options.ffz.badges,
        },
      } as OptionsItem<'ffz'>,
    ] as OptionsCategory['items'],
  },
  {
    id: 'stv',
    title: '7TV',
    items: [
      {
        name: 'emotes',
        title: 'Show Emotes',
        description: '',
        component: {
          type: 'switch',
          value: options.stv.emotes,
        },
      },
      {
        name: 'badges',
        title: 'Show Badges',
        description: '',
        component: {
          type: 'switch',
          value: options.stv.badges,
        },
      },
    ] as OptionsItem<'stv'>[] as OptionsCategory['items'],
  },
  {
    id: 'chatterino',
    title: 'Chatterino',
    items: [
      {
        name: 'badges',
        title: 'Show Badges',
        description: '',
        component: {
          type: 'switch',
          value: options.chatterino.badges,
        },
      } as OptionsItem<'chatterino'>,
    ] as OptionsCategory['items'],
  },
  {
    id: 'youtube',
    title: 'YouTube',
    items: [
      {
        name: 'cards',
        title: 'Show Youtube videos',
        description: 'Show previews for Youtube videos in the chat',
        component: {
          type: 'switch',
          value: options.youtube.cards,
        },
      } as OptionsItem<'youtube'>,
    ] as OptionsCategory['items'],
  },
];
export default createOptionsCategories;
