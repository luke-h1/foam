export interface FfzEmoticon {
  id: number;
  name: string;
  height: number;
  width: number;
  public: boolean;
  hidden: boolean;
  animated: boolean;
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
}

export interface FfzSet {
  id: number;
  _type: number;
  title: string;
  emoticons: FfzEmoticon[];
}

export interface FfzChannelEmotesResponse {
  room: {
    set: number | string;
    vip_badge?: { [key: string]: string };
    mod_urls?: { [key: string]: string };
    user_badge_ids?: { [key: string]: string[] };
    user_badges?: { [key: string]: string[] };
  };
  sets: {
    [setId: string]: FfzSet;
  };
}

export interface FfzGlobalEmotesResponse {
  default_sets: number[];
  sets: {
    [setId: string]: FfzSet;
  };
  users: {
    [userId: string]: string[];
  };
}
