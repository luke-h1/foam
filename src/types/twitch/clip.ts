export interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number;
  is_featured: boolean;
}

export interface TwitchCreatedClip {
  id: string;
  edit_url: string;
}

export interface TwitchClipsRequestParams {
  broadcasterId: string;
  after?: string;
  endedAt?: string;
  first?: number;
  startedAt?: string;
}
