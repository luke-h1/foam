/**
 * PATCH /helix/chat/settings body; only the provided fields change.
 */
export interface TwitchChatSettingsPatch {
  emote_mode?: boolean;
  follower_mode?: boolean;
  follower_mode_duration?: number;
  slow_mode?: boolean;
  slow_mode_wait_time?: number;
  subscriber_mode?: boolean;
  unique_chat_mode?: boolean;
}
