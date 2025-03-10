/* eslint-disable no-use-before-define */
import { Badges } from 'tmi.js';

export type BadgeVersions = {
  [badgeId: string]: string;
};

export type EmotePositions = {
  [emoteId: string]: string[];
};

export type ParserOptions = {
  channelId: string | null;
};

export type ParsedEmotesMessage = {
  content: string;
  position: string;
  emote?: {
    images: {
      width: number;
      height: number;
      url: string;
    }[];
    overlays?: {
      images: {
        width: number;
        height: number;
        url: string;
      }[];
      alt: string;
    }[];
    isZeroWidth?: boolean;
  };
}[];

export type MessageParser = (
  message: ParsedEmotesMessage,
  emotePositions: EmotePositions,
  options: ParserOptions,
) => Promise<ParsedEmotesMessage>;

export type EmotesLoader = (
  channelId: string | null,
  force?: boolean,
) => Promise<void>;

export type BadgesLoader = (
  channelId: string | null,
  force?: boolean,
) => Promise<void>;

export type EmotesParser = {
  provider: string;
  parse: MessageParser;
  load: EmotesLoader;
};

export type BadgesParser = {
  provider: string;
  parse: (
    badges: Badges,
    username: string | null,
    channelId: string | null,
  ) => Promise<ParsedBadges>;
  load: BadgesLoader;
};

// bttv

export interface BttvChannelEmote {
  id: string;
  code: string;
  imageType: string;
  animated: string;
  userId: string;
}

export interface BttvSharedEmote {
  id: string;
  code: string;
  imageType: string;
  animated: boolean;
  user: {
    id: string;
    name: string;
    displayName: string;
    providerId: string;
  };
}

export interface BttvChannelEmotesResponse {
  id: string;
  bots: unknown[];
  avatar: string;
  channelEmotes: BttvChannelEmote[];
  sharedemotes: {
    id: string;
    code: string;
    imageType: string;
    animated: boolean;
    user: {
      id: string;
      name: string;
      displayName: string;
      providerId: string;
    };
  }[];
}

export type BttvGlobalEmotesResponse = {
  id: string;
  code: string;
  imageType: string;
  animated: boolean;
  userId: string;
  modifier: boolean;
  width?: number;
  height?: number;
}[];

export type BttvBadgesResponse = {
  id: string;
  name: string;
  displayName: string;
  providerId: string;
  badge: {
    type: number;
    description: string;
    svg: string;
  };
}[];

export type EmotesList = {
  id: string;
  code: string;
  isZeroWidth?: boolean;
  channelId: string | null;
}[];

// ffz
export type FfzSet = {
  id: number;
  _type: number;
  title: string;
  emoticons: {
    id: number;
    name: string;
    height: number;
    width: number;
    public: boolean;
    hidden: boolean;
    modifier: boolean;
    modifier_flags: number;
    owner: {
      _id: number;
      name: string;
      display_name: string;
    };
    urls: {
      '1': string;
      '2': string;
      '4': string;
    };
    status: number;
    usage_count: number;
    created_at: string;
    last_updated: string;
  }[];
};

export type FfzChannelEmotesResponse = {
  room: unknown;
  sets: {
    [setId: string]: FfzSet;
  };
};

export type FfzGlobalEmotesResponse = {
  default_sets: number[];
  sets: {
    [setId: string]: FfzSet;
  };
  users: {
    [userId: string]: string[];
  };
};

export type FfzBadgesResponse = {
  badges: FfzBadge[];
  users: FfzBadgeUsers;
};

export type FfzBadge = {
  id: number;
  name: string;
  title: string;
  slot: number;
  replaces: string;
  color: string;
  image: string;
  urls: {
    '1': string;
    '2': string;
    '4': string;
  };
};

export type FfzBadgeUsers = {
  [badgeId: string]: string[];
};

interface Connection {
  id: string;
  platform: 'TWITCH';
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set_id: string;
}

export interface SevenTvEmote {
  id: string;
  name: string;
  flags: number;
  timestamp: number;
  actor_id: string;
  data: {
    id: string;
    name: string;
    flags: number;
    lifecycle: number;
    state: string[];
    listed: boolean;
    animated: boolean;
    tags?: string[];

    owner: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      style: {
        paint_id?: string;
        badge_id?: string;
        color?: number;
      };
      role_ids: string[];
      connection: Connection[];
      roles?: string[];
    };
    host: {
      url: string;
      files: {
        name: string;
        static_name: string;
        width: number;
        height: number;
        frame_count: number;
        size: number;
        format: string;
      }[];
    };
  };
}

// 7tv
export interface StvEmoteSet {
  id: string;
  name: string;
  flags: number;
  immutable: boolean;
  privileged: boolean;
  emotes: SevenTvEmote[];
  emote_count: number;
  capacity: number;
  owner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    style: {
      color: number;
      badge_id: string;
      paint_id: string;
    };
    roles: string[];
  };
}

export type StvGlobalEmotesResponse = StvEmoteSet;

export type StvChannelEmotesResponse = {
  id: string;
  platform: string;
  username: string;
  display_name: string;
  linked_at: number;
  emote_capacity: number;
  emote_set: StvEmoteSet;
  user: {
    id: string;
    username: string;
    display_name: string;
    created_at: number;
    avatar_url: string;
  };
};

// twitch

export type TwitchBadgesResponse = {
  id: string;
  versions: {
    id: string;
    title: string;
    description: string;
    clickAction: string;
    clickUrl: string;
    image_url_1x: string;
    image_url_2x: string;
    image_url_4x: string;
  }[];
}[];

export type TwitchBadgesList = {
  id: string;
  versionId: string;
  channelId: string | null;
  title: string;
  description: string;
  clickAction: string;
  clickUrl: string;
  images: string[];
}[];

export type TwitchBadgeVersions = {
  [badgeId: string]: string;
};

export type ParsedBadges = {
  id: string;
  title: string;
  slot?: number;
  replaces?: string | null;
  color?: string;
  images: string[];
}[];
