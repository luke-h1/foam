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
