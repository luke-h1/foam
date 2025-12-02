/**
 * Base interface for common USERNOTICE tags
 * All USERNOTICE messages share these common tags
 */
export interface BaseUserNoticeTags
  extends Record<string, string | boolean | undefined> {
  'msg-id': string;
  id?: string;
  'display-name'?: string;
  login?: string;
  color?: string;
  badges?: string;
  'badge-info'?: string;
  emotes?: string;
  flags?: string;
  mod?: string;
  'room-id'?: string;
  subscriber?: '1' | '0'; // 1=yes or 0=not subbed;
  'system-msg'?: string; // raw IRC message
  'tmi-sent-ts'?: string;
  'user-id'?: string;
  'user-type'?: string;
  vip?: '0' | '1';
}

export interface ViewerMilestoneTags extends BaseUserNoticeTags {
  'msg-id': 'viewermilestone';
  'msg-param-category': 'watch-streak';
  'msg-param-copoReward': string; // i.e. 450 = 450 channel points earned
  'msg-param-id': string;
  'msg-param-value': string; // number of days as a string i.e. 5
}

type MsgParamSubPlan = 'Prime' | '1000' | '2000' | '3000';

export interface SubscriptionTags extends BaseUserNoticeTags {
  'msg-id': 'sub' | 'resub';
  'msg-param-cumulative-months': string;

  /**
   * Weather to share their sub streak
   */
  'msg-param-should-share-streak': '1' | '0';

  /**
   * The number of consecutive months the user has subscribed.
   * This is zero (0) if msg-param-should-share-streak is 0.
   */
  'msg-param-streak-months': string;

  'msg-param-sub-plan': MsgParamSubPlan;

  /**
   * The display name of the subscription plan
   */
  'msg-param-sub-plan-name': string;
}

export type ResubTags = SubscriptionTags;

export interface SubGiftTags extends BaseUserNoticeTags {
  'msg-id': 'subgift';
  'msg-param-sub-plan': MsgParamSubPlan;
  /**
   * The number of months gifted
   */
  'msg-param-gift-months': string;

  /**
   * The username of the recipient of the gift sub
   */
  'msg-param-recipient-user-name': string;

  /**
   * The display name of the recipient of the gift sub
   */
  'msg-param-recipient-display-name': string;

  /**
   * The user ID of the recipient of the gift sub
   */
  'msg-param-recipient-id': string;

  /**
   * The total number of the months the user has subscribed
   */
  'msg-param-months': string;
}

export interface AnonGiftPaidUpgradeTags extends BaseUserNoticeTags {
  'msg-id': 'anongiftpaidupgrade';
  /**
   * The subscriptions promotion (if any) - i.e. Valorant discount
   */
  'msg-param-promo-name': string;

  /**
   * The number of gifts the gifter has given during the
   * promotion, indicated by the promo name param
   */
  'msg-param-promo-gift-total': string;
}

export interface RaidTags extends BaseUserNoticeTags {
  'msg-id': 'raid';
  /**
   * The number of viewers that are raiding
   */
  'msg-param-viewerCount': string;

  /**
   * The login name of the broadcaster who is raiding this channel
   */
  'msg-param-login': string;

  /**
   * The display name of the broadcaster who is raiding this channel
   */
  'msg-param-displayName': string;
}

/**
 * Type mapping from msg-id values to their corresponding tag types
 */
export type UserNoticeVariantMap = {
  viewermilestone: ViewerMilestoneTags;
  sub: SubscriptionTags;
  resub: SubscriptionTags;
  subgift: SubGiftTags;
  anongiftpaidupgrade: AnonGiftPaidUpgradeTags;
  raid: RaidTags;
};

/**
 * Extract the specific tag type based on msg-id
 */
export type UserNoticeTagsByVariant<T extends keyof UserNoticeVariantMap> =
  UserNoticeVariantMap[T];

export type UserNoticeTags =
  | ViewerMilestoneTags
  | SubscriptionTags
  | SubGiftTags
  | AnonGiftPaidUpgradeTags
  | RaidTags;
