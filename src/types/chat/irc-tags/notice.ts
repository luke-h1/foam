type NoticeMsgId =
  | 'emote_only_off'
  | 'emote_only_on'
  | 'followers_off'
  | 'followers_on'
  | 'followers_on_zero'
  | 'msg_banned'
  | 'msg_bad_characters'
  | 'msg_channel_blocked'
  | 'msg_channel_suspended'
  | 'msg_duplicate'
  | 'msg_emoteonly'
  | 'msg_followersonly'
  | 'msg_followersonly_followed'
  | 'msg_followersonly_zero'
  | 'msg_r9k'
  | 'msg_ratelimit'
  | 'msg_rejected'
  | 'msg_rejected_mandatory'
  | 'msg_requires_verified_phone_number'
  | 'msg_slowmode'
  | 'msg_subsonly'
  | 'msg_suspended'
  | 'msg_timedout'
  | 'msg_verified_email'
  | 'slow_off'
  | 'slow_on'
  | 'subs_off'
  | 'subs_on'
  | 'tos_ban'
  | 'unrecognized_cmd';

export interface NoticeTags {
  'msg-id': NoticeMsgId;

  'target-user-id': string;
}
