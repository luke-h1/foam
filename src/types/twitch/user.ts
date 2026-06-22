export interface UserInfoResponse {
  broadcaster_type: string;
  created_at: string;
  description: string;
  display_name: string;
  id: string;
  login: string;
  offline_image_url: string;
  profile_image_url: string;
  type: string;
  view_count: number;
}

export interface UserBlockList {
  user_id: string;
  user_login: string;
  display_name: string;
}

export interface UserBlockListRequestParams {
  broadcasterId: string;
  first?: number;
  after?: number;
}
