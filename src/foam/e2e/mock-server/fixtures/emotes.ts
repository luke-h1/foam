// Realistic mock emote data for 7TV, BTTV, FFZ, and Twitch
// Matches the response shapes the app's emote services expect

// ── BTTV ─────────────────────────────────────────────────────────────────────

export const globalBttvEmotes = [
  {
    id: '5590b223b344e2c42a9e28e3',
    code: 'OkayChamp',
    imageType: 'png',
    animated: false,
  },
  {
    id: '5e76d338d6581c3724c0f0b2',
    code: 'PogChamp',
    imageType: 'png',
    animated: false,
  },
  {
    id: '55029945a87c7c58edc78a9c',
    code: 'FeelsBadMan',
    imageType: 'png',
    animated: false,
  },
  {
    id: '5590b223b344e2c42a9e28e4',
    code: 'OMEGALUL',
    imageType: 'png',
    animated: false,
  },
  {
    id: '5e4a8b64cf0be3769d94eb8f',
    code: 'monkaS',
    imageType: 'png',
    animated: false,
  },
  {
    id: '55028cd2135896936880fdd7',
    code: 'Kreygasm',
    imageType: 'png',
    animated: false,
  },
  {
    id: '5e9c5e4fd6581c3724c00c22',
    code: 'FeelsGoodMan',
    imageType: 'png',
    animated: false,
  },
  {
    id: '5d38aaa592fc3f6e0b3f7cd2',
    code: 'peepoHappy',
    imageType: 'png',
    animated: false,
  },
];

export const channelBttvEmotes = (channelId: string) => ({
  id: channelId,
  bots: [],
  avatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/placeholder.png',
  channelEmotes: [
    {
      id: 'bttvch1',
      code: 'FeelsGoodMan',
      imageType: 'png',
      animated: false,
      userId: channelId,
    },
    {
      id: 'bttvch2',
      code: 'widepeepoHappy',
      imageType: 'gif',
      animated: true,
      userId: channelId,
    },
  ],
  sharedEmotes: [
    {
      id: 'bttvsh1',
      code: 'Sadge',
      imageType: 'png',
      animated: false,
      userId: '9999',
    },
    {
      id: 'bttvsh2',
      code: 'KEKW',
      imageType: 'png',
      animated: false,
      userId: '9998',
    },
  ],
});

// ── FFZ ───────────────────────────────────────────────────────────────────────

export const ffzGlobalSet = {
  default_sets: [3],
  sets: {
    3: {
      id: 3,
      _type: 1,
      title: 'Global Emoticons',
      emoticons: [
        {
          id: 128054,
          name: 'LULW',
          height: 28,
          width: 28,
          public: true,
          hidden: false,
          modifier: false,
          status: 1,
          usage_count: 10000000,
          created_at: '2014-04-06T04:00:00.000Z',
          last_updated: '2024-01-01T00:00:00.000Z',
          urls: {
            1: 'https://cdn.frankerfacez.com/emote/128054/1',
            2: 'https://cdn.frankerfacez.com/emote/128054/2',
            4: 'https://cdn.frankerfacez.com/emote/128054/4',
          },
        },
        {
          id: 159480,
          name: 'catJAM',
          height: 32,
          width: 32,
          public: true,
          hidden: false,
          modifier: false,
          status: 1,
          usage_count: 5000000,
          created_at: '2020-09-01T00:00:00.000Z',
          last_updated: '2024-01-01T00:00:00.000Z',
          urls: {
            1: 'https://cdn.frankerfacez.com/emote/159480/1',
            2: 'https://cdn.frankerfacez.com/emote/159480/2',
          },
        },
      ],
    },
  },
};

export const ffzRoom = (channelId: string) => ({
  room: {
    _id: Number(channelId) || 1,
    twitch_id: Number(channelId) || 1,
    id: channelId,
    is_group: false,
    display_name: channelId,
    set: 1000,
    moderator_badge: null,
    vip_badge: null,
    game_badge: null,
    live: false,
    css: null,
    data: null,
  },
  sets: {
    1000: {
      id: 1000,
      _type: 1,
      title: 'Channel Emoticons',
      emoticons: [
        {
          id: 1000001,
          name: 'PauseChamp',
          height: 32,
          width: 32,
          public: true,
          hidden: false,
          modifier: false,
          status: 1,
          usage_count: 100000,
          created_at: '2018-01-01T00:00:00.000Z',
          last_updated: '2024-01-01T00:00:00.000Z',
          urls: { 1: 'https://cdn.frankerfacez.com/emote/1000001/1' },
        },
      ],
    },
  },
});

export const ffzBadges = {
  badges: [
    {
      id: 1,
      name: 'FFZ Supporter',
      title: 'FFZ Supporter',
      slot: 0,
      replaces: null,
      color: '#4649b4',
      image: 'https://cdn.frankerfacez.com/badge/1/1/solid',
      urls: {
        1: 'https://cdn.frankerfacez.com/badge/1/1/solid',
        2: 'https://cdn.frankerfacez.com/badge/1/2/solid',
        4: 'https://cdn.frankerfacez.com/badge/1/4/solid',
      },
    },
  ],
  users: {},
};

// ── 7TV ───────────────────────────────────────────────────────────────────────

export const sevenTvGlobalEmoteSet = {
  id: 'global',
  name: 'Global Emotes',
  flags: 0,
  tags: [],
  immutable: true,
  privileged: false,
  emotes: [
    {
      id: '60ae3d83ba045b3a1a7c5f6e',
      name: 'Sadge',
      flags: 0,
      timestamp: 1622000000000,
      actor_id: null,
      data: {
        id: '60ae3d83ba045b3a1a7c5f6e',
        name: 'Sadge',
        flags: 0,
        lifecycle: 3,
        state: ['LISTED'],
        listed: true,
        animated: false,
        owner: null,
        host: {
          url: '//cdn.7tv.app/emote/60ae3d83ba045b3a1a7c5f6e',
          files: [
            {
              name: '1x.webp',
              static_name: '1x_static.webp',
              width: 28,
              height: 28,
              frame_count: 1,
              size: 1024,
              format: 'WEBP',
            },
            {
              name: '2x.webp',
              static_name: '2x_static.webp',
              width: 56,
              height: 56,
              frame_count: 1,
              size: 2048,
              format: 'WEBP',
            },
            {
              name: '4x.webp',
              static_name: '4x_static.webp',
              width: 112,
              height: 112,
              frame_count: 1,
              size: 4096,
              format: 'WEBP',
            },
          ],
        },
      },
    },
    {
      id: '60b0c0b43a2a3ca21e01b745',
      name: 'peepoHappy',
      flags: 0,
      timestamp: 1622200000000,
      actor_id: null,
      data: {
        id: '60b0c0b43a2a3ca21e01b745',
        name: 'peepoHappy',
        flags: 0,
        lifecycle: 3,
        state: ['LISTED'],
        listed: true,
        animated: true,
        owner: null,
        host: {
          url: '//cdn.7tv.app/emote/60b0c0b43a2a3ca21e01b745',
          files: [
            {
              name: '1x.gif',
              static_name: '1x_static.webp',
              width: 28,
              height: 28,
              frame_count: 6,
              size: 8192,
              format: 'GIF',
            },
            {
              name: '2x.gif',
              static_name: '2x_static.webp',
              width: 56,
              height: 56,
              frame_count: 6,
              size: 16384,
              format: 'GIF',
            },
          ],
        },
      },
    },
    {
      id: '60b6f29c0df5adab17c7ea7e',
      name: 'HYPERS',
      flags: 0,
      timestamp: 1622600000000,
      actor_id: null,
      data: {
        id: '60b6f29c0df5adab17c7ea7e',
        name: 'HYPERS',
        flags: 0,
        lifecycle: 3,
        state: ['LISTED'],
        listed: true,
        animated: true,
        owner: null,
        host: {
          url: '//cdn.7tv.app/emote/60b6f29c0df5adab17c7ea7e',
          files: [
            {
              name: '1x.gif',
              static_name: '1x_static.webp',
              width: 32,
              height: 32,
              frame_count: 12,
              size: 12288,
              format: 'GIF',
            },
          ],
        },
      },
    },
  ],
  capacity: 300,
};

export const sevenTvChannelUser = (twitchId: string) => ({
  id: `stv_${twitchId}`,
  username: `user_${twitchId}`,
  display_name: `User ${twitchId}`,
  created_at: '2021-01-01T00:00:00Z',
  avatar_url: '',
  style: {},
  roles: [],
  connections: [
    {
      id: twitchId,
      username: `user_${twitchId}`,
      display_name: `User ${twitchId}`,
      platform: 'TWITCH',
      linked_at: 0,
      emote_capacity: 600,
      emote_set_id: `eset_${twitchId}`,
      emote_set: {
        id: `eset_${twitchId}`,
        name: `Channel ${twitchId}`,
        flags: 0,
        tags: [],
        immutable: false,
        privileged: false,
        emotes: [
          {
            id: '62a2b8c6d46a0f21d6082a9a',
            name: 'GIGACHAD',
            flags: 0,
            timestamp: 1654800000000,
            actor_id: null,
            data: {
              id: '62a2b8c6d46a0f21d6082a9a',
              name: 'GIGACHAD',
              flags: 0,
              lifecycle: 3,
              state: ['LISTED'],
              listed: true,
              animated: false,
              owner: null,
              host: {
                url: '//cdn.7tv.app/emote/62a2b8c6d46a0f21d6082a9a',
                files: [
                  {
                    name: '1x.webp',
                    static_name: '1x_static.webp',
                    width: 28,
                    height: 28,
                    frame_count: 1,
                    size: 1024,
                    format: 'WEBP',
                  },
                  {
                    name: '2x.webp',
                    static_name: '2x_static.webp',
                    width: 56,
                    height: 56,
                    frame_count: 1,
                    size: 2048,
                    format: 'WEBP',
                  },
                ],
              },
            },
          },
        ],
        capacity: 600,
      },
    },
  ],
});

export const sevenTvCosmetics = {
  badges: [
    {
      id: 'badge_subscriber',
      name: '7TV Subscriber',
      tag: 'Subscriber',
      tooltip: '7TV Subscriber',
      urls: [
        ['1', 'https://cdn.7tv.app/badge/subscriber/1x.webp'],
        ['2', 'https://cdn.7tv.app/badge/subscriber/2x.webp'],
        ['3', 'https://cdn.7tv.app/badge/subscriber/3x.webp'],
      ],
      users: [],
      misc: false,
    },
  ],
  paints: [],
};

// ── Sample chat messages with emote references for IRC mock ──────────────────

export const sampleChatMessages = (channel: string) => [
  `@badge-info=;badges=moderator/1;color=#FF4500;display-name=ChatBot;emotes=;first-msg=0;flags=;id=msg-1;mod=1;returning-chatter=0;room-id=123;subscriber=0;tmi-sent-ts=${Date.now()};turbo=0;user-id=9001;user-type=mod :chatbot!chatbot@chatbot.tmi.twitch.tv PRIVMSG ${channel} :Welcome to the stream! peepoHappy`,
  `@badge-info=subscriber/3;badges=subscriber/3;color=#1E90FF;display-name=viewer1;emotes=;first-msg=0;flags=;id=msg-2;mod=0;returning-chatter=0;room-id=123;subscriber=1;tmi-sent-ts=${Date.now()};turbo=0;user-id=9002;user-type= :viewer1!viewer1@viewer1.tmi.twitch.tv PRIVMSG ${channel} :GIGACHAD Sadge lets go`,
  `@badge-info=;badges=;color=#FF69B4;display-name=viewer2;emotes=425618:0-9;first-msg=1;flags=;id=msg-3;mod=0;returning-chatter=0;room-id=123;subscriber=0;tmi-sent-ts=${Date.now()};turbo=0;user-id=9003;user-type= :viewer2!viewer2@viewer2.tmi.twitch.tv PRIVMSG ${channel} :bleedPurple KEKW OMEGALUL`,
  `@badge-info=;badges=;color=#00FF7F;display-name=viewer3;emotes=;first-msg=0;flags=;id=msg-4;mod=0;returning-chatter=0;room-id=123;subscriber=0;tmi-sent-ts=${Date.now()};turbo=0;user-id=9004;user-type= :viewer3!viewer3@viewer3.tmi.twitch.tv PRIVMSG ${channel} :catJAM HYPERS peepoHappy`,
];
