export interface Channel {
  broadcasterId: string;
  broadcasterLogin: string;
  broadcasterName: string;
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
