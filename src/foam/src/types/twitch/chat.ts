export type TwitchChatMessageFragment = {
  type: 'text' | 'cheermote' | 'emote' | 'mention';
  text: string;
  cheermote?: unknown;
  emote?: {
    id?: string;
    emote_set_id?: string;
    owner_id?: string;
    format?: string[];
  };
  mention?: {
    user_id?: string;
    user_login?: string;
    user_name?: string;
  };
};

export type TwitchPinnedChatMessage = {
  broadcaster_id?: string;
  broadcaster_login?: string;
  broadcaster_name?: string;
  created_at?: string;
  expires_at?: string | null;
  message?:
    | string
    | {
        fragments?: TwitchChatMessageFragment[];
        text?: string;
      };
  message_id: string;
  moderator_id?: string;
  moderator_login?: string;
  moderator_name?: string;
  pinned_by_login?: string;
  pinned_by_name?: string;
  pinned_by_user_id?: string;
  updated_at?: string;
};

export type TwitchSendChatMessageResult = {
  drop_reason?: {
    code: string;
    message: string;
  } | null;
  is_sent: boolean;
  message_id: string;
};
