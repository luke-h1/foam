import type { EmoteSetKind } from '@app/graphql/generated/gql';
import type { SanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';

type ProviderPreviewFixtures = {
  badges: SanitisedBadgeSet[];
  emotes: SanitisedEmote[];
};

export const chatPreferencePreviewFixtures = {
  '7tv': {
    badges: [
      {
        id: '62f99d0ce46eb00e438a6984',
        provider: '7tv',
        set: 'preview-7tv',
        title: '7TV Supporter',
        type: '7TV Badge',
        url: 'https://cdn.7tv.app/badge/62f99d0ce46eb00e438a6984/4x.webp',
      },
    ],
    emotes: [
      {
        aspect_ratio: 1,
        creator: 'yoim5th',
        emote_link: 'https://7tv.app/emotes/01F5PA9D3000034VRANA2SYVDP',
        flags: 0,
        format: 'avif',
        frame_count: 72,
        height: 128,
        id: '01F5PA9D3000034VRANA2SYVDP',
        name: 'yePls',
        original_name: 'kanyePls',
        set_metadata: {
          capacity: 1000,
          kind: 'NORMAL' as EmoteSetKind,
          ownerId: '01F6Z6B6A0000E13Z2T8PKGDWP',
          setId: '01K6JX5NYKV4R3XJ8HZY9EGEFF',
          setName: 'willy_2',
          totalCount: 997,
          updatedAt: '2026-06-11T01:54:11.599+00:00',
        },
        site: '7TV Channel',
        static_url:
          'https://cdn.7tv.app/emote/01F5PA9D3000034VRANA2SYVDP/4x_static.avif',
        url: 'https://cdn.7tv.app/emote/01F5PA9D3000034VRANA2SYVDP/4x.avif',
        width: 128,
        zero_width: false,
      },
      {
        aspect_ratio: 1,
        creator: 'TrippyColour',
        emote_link: 'https://7tv.app/emotes/01GB4EV0Q800090V9B3D8CGEHV',
        flags: 0,
        format: 'avif',
        frame_count: 1,
        height: 128,
        id: '01GB4EV0Q800090V9B3D8CGEHV',
        name: 'FeelsStrongMan',
        original_name: 'FeelsStrongMan',
        set_metadata: {
          capacity: 1000,
          kind: 'NORMAL' as EmoteSetKind,
          ownerId: '01FRG0ZGSR00084PQ73P1BYDX8',
          setId: '01HKQT8EWR000ESSWF3625XCS4',
          setName: 'Global Emotes',
          totalCount: 44,
          updatedAt: '2025-12-14T20:18:38.018+00:00',
        },
        site: '7TV Global',
        static_url:
          'https://cdn.7tv.app/emote/01GB4EV0Q800090V9B3D8CGEHV/4x.avif',
        url: 'https://cdn.7tv.app/emote/01GB4EV0Q800090V9B3D8CGEHV/4x.avif',
        width: 128,
        zero_width: false,
      },
    ],
  },
  bttv: {
    badges: [
      {
        id: 'preview-bttv-badge',
        provider: 'bttv',
        set: 'preview-bttv',
        title: 'BTTV Supporter',
        type: 'BTTV Badge',
        url: 'https://cdn.betterttv.net/emote/5f1c24b91ab9be446c4d78dc/3x',
      },
    ],
    emotes: [
      {
        creator: null,
        emote_link: 'https://betterttv.com/emotes/5f1c24b91ab9be446c4d78dc',
        id: '5f1c24b91ab9be446c4d78dc',
        name: 'catJAM',
        original_name: 'UNKNOWN',
        site: 'BTTV',
        static_url:
          'https://cdn.betterttv.net/emote/5f1c24b91ab9be446c4d78dc/3x.png',
        url: 'https://cdn.betterttv.net/emote/5f1c24b91ab9be446c4d78dc/3x',
      },
      {
        creator: null,
        emote_link: 'https://betterttv.com/emotes/5ee22dfb924aa35e32a7a112',
        id: '5ee22dfb924aa35e32a7a112',
        name: 'AYAYA',
        original_name: 'UNKNOWN',
        site: 'BTTV',
        static_url:
          'https://cdn.betterttv.net/emote/5ee22dfb924aa35e32a7a112/3x',
        url: 'https://cdn.betterttv.net/emote/5ee22dfb924aa35e32a7a112/3x',
      },
    ],
  },
  ffz: {
    badges: [
      {
        id: 'vip_badge',
        set: 'vip',
        title: 'VIP',
        type: 'FFZ channel badge',
        url: 'https://cdn.frankerfacez.com/room-badge/vip/id/12943173/v/384f5396/4',
      },
    ],
    emotes: [
      {
        aspect_ratio: 0.96875,
        creator: 'dourgent',
        emote_link: 'https://www.frankerfacez.com/emoticon/128054',
        height: 32,
        id: '128054',
        name: 'OMEGALUL',
        original_name: 'UNKNOWN',
        site: 'FFZ',
        static_url: 'https://cdn.frankerfacez.com/emote/128054/4',
        url: 'https://cdn.frankerfacez.com/emote/128054/4',
        width: 31,
      },
      {
        aspect_ratio: 0.8235294117647058,
        creator: 'UNKNOWN',
        emote_link: 'https://www.frankerfacez.com/emoticon/6',
        height: 34,
        id: '6',
        name: 'YooHoo',
        original_name: 'UNKNOWN',
        site: 'Global FFZ',
        static_url: 'https://cdn.frankerfacez.com/emote/6/4',
        url: 'https://cdn.frankerfacez.com/emote/6/4',
        width: 28,
      },
    ],
  },
  twitch: {
    badges: [
      {
        id: 'subscriber_0',
        set: 'subscriber',
        title: 'Subscriber',
        type: 'Twitch Global Badge',
        url: 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3',
      },
      {
        id: 'premium_1',
        set: 'premium',
        title: 'Prime Gaming',
        type: 'Twitch Global Badge',
        url: 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3',
      },
    ],
    emotes: [
      {
        creator: null,
        emote_link:
          'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
        id: '25',
        name: 'Kappa',
        original_name: 'Kappa',
        site: 'Twitch Global',
        static_url:
          'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/3.0',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
      },
      {
        creator: null,
        emote_link:
          'https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/3.0',
        id: '305954156',
        name: 'PogChamp',
        original_name: 'PogChamp',
        site: 'Twitch Global',
        static_url:
          'https://static-cdn.jtvnw.net/emoticons/v2/305954156/static/dark/3.0',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/305954156/default/dark/3.0',
      },
    ],
  },
} satisfies Record<PreviewProvider, ProviderPreviewFixtures>;
