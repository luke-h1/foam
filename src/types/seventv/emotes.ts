import type { StvConnection } from '@app/types/seventv/users';

export interface SevenTvFile {
  name: string;
  static_name: string;
  width: number;
  height: number;
  frame_count: number;
  size: number;
  format: string;
}

export interface SevenTvHost {
  url: string;
  files: SevenTvFile[];
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
      connection: StvConnection[];
      roles?: string[];
    };
    host: {
      url: string;
      files: SevenTvFile[];
    };
  };
}

export interface SevenTvEmotePreview {
  id: string;
  name: string;
  owner: {
    display_name: string;
    username: string;
  } | null;
}
