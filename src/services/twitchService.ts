export interface UserInfoResponse {
  id: string;
  login: string;
  type: string;
  description: string;
  display_name: string;
  view_count: number;
  offline_image_url: string;
  profile_image_url: string;
  broadcaster_type: string;
  created_at: string;
}

export interface Category {
  box_art_url: string;
  id: string;
  igdb_id?: string; // can be an empty string so we specify undefined to represent the falsy value
  name: string;
}

export interface SearchChannelResponse {
  broadcaster_language: string;
  broadcaster_login: string;
  display_name: string;
  game_id: string;
  game_name: string;
  id: string;
  is_live: boolean;
  tag_ids: unknown[];
  tags: string[];
  thumbnail_url: string;
  title: string;
  started_at: string;
}

export interface DefaultTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface Stream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: unknown[];
  tags: string[];
  is_mature: boolean;
}

const twitchService = {} as const;

export default twitchService;
