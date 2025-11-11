type NoticeMsgId =
  /**
   * This room is no longer in emote-only mode.
   */
  | 'emote_only_off'

  /**
   * This room is now in emote-only mode.
   */
  | 'emote_only_on'
  /**
   * This room is no longer in followers-only mode.
   */
  | 'followers_off'
  /**
   * This room is now in <duration> followers-only mode.
   */
  | 'followers_on'
  /**
   * This room is now in followers-only mode.
   */
  | 'followers_on_zero'
  /**
   * You are permanently banned from talking in <channel>.
   */
  | 'msg_banned'
  /**
   * Your message was not sent because it contained too many unprocessable characters. If you believe this is an error, please rephrase and try again.
   */
  | 'msg_bad_characters'
  /**
   * Your message was not sent because your account is not in good standing in this channel.
   */
  | 'msg_channel_blocked'
  /**
   * This channel does not exist or has been suspended.
   */
  | 'msg_channel_suspended'
  /**
   * Your message was not sent because it is identical to the previous one you sent, less than 30 seconds ago.
   */
  | 'msg_duplicate'
  /**
   * This room is in emote-only mode. You can find your currently available emoticons using the smiley in the chat text area.
   */
  | 'msg_emoteonly'
  /**
   * This room is in <duration> followers-only mode. Follow <channel> to join the community! Note: These msg_followers tags are kickbacks to a user who does not meet the criteria; that is, does not follow or has not followed long enough.
   */
  | 'msg_followersonly'
  /**
   * This room is in <duration1> followers-only mode. You have been following for <duration2>. Continue following to chat!
   */
  | 'msg_followersonly_followed'
  /**
   * This room is in followers-only mode. Follow <channel> to join the community!
   */
  | 'msg_followersonly_zero'
  /**
   * This room is in unique-chat mode and the message you attempted to send is not unique.
   */
  | 'msg_r9k'
  /**
   * Your message was not sent because you are sending messages too quickly.
   */
  | 'msg_ratelimit'
  /**
   * Hey! Your message is being checked by mods and has not been sent.
   */
  | 'msg_rejected'
  /**
   * Your message wasn’t posted due to conflicts with the channel’s moderation settings.
   */
  | 'msg_rejected_mandatory'
  /**
   * A verified phone number is required to chat in this channel. Please visit https://www.twitch.tv/settings/security to verify your phone number.
   */
  | 'msg_requires_verified_phone_number'
  /**
   * This room is in slow mode and you are sending messages too quickly. You will be able to talk again in <number> seconds.
   */
  | 'msg_slowmode'
  /**
   * This room is in subscribers only mode. To talk, purchase a channel subscription at https://www.twitch.tv/products/<broadcaster login name>/ticket?ref=subscriber_only_mode_chat.
   */
  | 'msg_subsonly'
  /**
   * You don’t have permission to perform that action.
   */
  | 'msg_suspended'
  /**
   * You are timed out for <number> more seconds.
   */
  | 'msg_timedout'
  /**
   * This room requires a verified account to chat. Please verify your account at https://www.twitch.tv/settings/security.
   */
  | 'msg_verified_email'
  /**
   * This room is no longer in slow mode.
   */
  | 'slow_off'
  /**
   * This room is now in slow mode. You may send messages every <number> seconds.
   */
  | 'slow_on'
  /**
   * This room is no longer in subscribers-only mode.
   */
  | 'subs_off'

  /**
   * This room is now in subscribers-only mode.
   */
  | 'subs_on'
  /**
   * The community has closed channel <channel> due to Terms of Service violations.
   */
  | 'tos_ban'
  /**
   * Unrecognized command: <command>
   */
  | 'unrecognized_cmd';

export interface NoticeTags {
  /**
   * The ID to determine the actions outcome
   */
  'msg-id': NoticeMsgId;

  /**
   * The ID of the user that the action targeted
   */
  'target-user-id': string;
}
