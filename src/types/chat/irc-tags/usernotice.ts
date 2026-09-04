export interface BaseUserNoticeTags extends Record<
  string,
  string | boolean | undefined
> {
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
  subscriber?: '1' | '0';
  'system-msg'?: string;
  'tmi-sent-ts'?: string;
  'user-id'?: string;
  'user-type'?: string;
  vip?: '0' | '1';
  'custom-reward-id'?: string;
  'msg-param-custom-reward-title'?: string;
  'msg-param-reward-title'?: string;
}

export interface ViewerMilestoneTags extends BaseUserNoticeTags {
  'msg-id': 'viewermilestone';
  'msg-param-category': 'watch-streak';
  'msg-param-copoReward': string; // channel points earned
  'msg-param-id': string;
  'msg-param-value': string; // streak days, as a string
}

type MsgParamSubPlan = 'Prime' | '1000' | '2000' | '3000';

export interface SubscriptionTags extends BaseUserNoticeTags {
  'msg-id': 'sub' | 'resub';
  'msg-param-cumulative-months': string;

  'msg-param-should-share-streak': '1' | '0';

  'msg-param-streak-months': string;

  'msg-param-sub-plan': MsgParamSubPlan;

  'msg-param-sub-plan-name': string;
}

export interface SubGiftTags extends BaseUserNoticeTags {
  'msg-id': 'subgift';
  'msg-param-sub-plan': MsgParamSubPlan;
  'msg-param-gift-months': string;

  'msg-param-recipient-user-name': string;

  'msg-param-recipient-display-name': string;

  'msg-param-recipient-id': string;

  'msg-param-months': string;
}

export interface AnonGiftPaidUpgradeTags extends BaseUserNoticeTags {
  'msg-id': 'anongiftpaidupgrade';
  'msg-param-promo-name': string;

  'msg-param-promo-gift-total': string;
}

export interface SubMysteryGiftTags extends BaseUserNoticeTags {
  'msg-id': 'submysterygift';
  'msg-param-mass-gift-count'?: string;
  'msg-param-sender-count'?: string;
  'msg-param-sub-plan'?: MsgParamSubPlan;
}

export interface GiftPaidUpgradeTags extends BaseUserNoticeTags {
  'msg-id': 'giftpaidupgrade';
  'msg-param-sender-login'?: string;
  'msg-param-sender-name'?: string;
  'msg-param-promo-name'?: string;
  'msg-param-promo-gift-total'?: string;
}

export interface RaidTags extends BaseUserNoticeTags {
  'msg-id': 'raid';
  'msg-param-viewerCount': string;

  'msg-param-login': string;

  'msg-param-displayName': string;
}

export interface RewardGiftTags extends BaseUserNoticeTags {
  'msg-id': 'rewardgift';
}

export interface UnraidTags extends BaseUserNoticeTags {
  'msg-id': 'unraid';
}

export interface BitsBadgeTierTags extends BaseUserNoticeTags {
  'msg-id': 'bitsbadgetier';
  'msg-param-threshold'?: string;
}

export interface SharedChatNoticeTags extends BaseUserNoticeTags {
  'msg-id': 'sharedchatnotice';
}

export interface ModiversaryTags extends BaseUserNoticeTags {
  'msg-id': 'modiversary';
  'msg-param-months'?: string;
}

export interface AnnouncementTags extends BaseUserNoticeTags {
  'msg-id': 'announcement';
  'msg-param-color'?: string;
}

export interface HighlightedMessageTags extends BaseUserNoticeTags {
  'msg-id': 'highlighted-message';
}

export interface CharityDonationTags extends BaseUserNoticeTags {
  'msg-id': 'charitydonation';
  'msg-param-charity-name'?: string;
  'msg-param-donation-amount'?: string;
  'msg-param-donation-currency'?: string;
  'msg-param-exponent'?: string;
}

export interface RitualTags extends BaseUserNoticeTags {
  'msg-id': 'ritual';
  'msg-param-ritual-name'?: string;
}

export interface PrimePaidUpgradeTags extends BaseUserNoticeTags {
  'msg-id': 'primepaidupgrade';
  'msg-param-sub-plan'?: MsgParamSubPlan;
  'msg-param-sub-plan-name'?: string;
  'msg-param-cumulative-months'?: string;
}

export interface ExtendSubTags extends BaseUserNoticeTags {
  'msg-id': 'extendsub';
  'msg-param-sub-plan'?: MsgParamSubPlan;
  'msg-param-sub-plan-name'?: string;
  'msg-param-cumulative-months'?: string;
  'msg-param-streak-months'?: string;
  'msg-param-should-share-streak'?: '1' | '0';
}

export interface PayForwardTags extends BaseUserNoticeTags {
  'msg-id': 'standardpayforward' | 'communitypayforward';
  'msg-param-sub-plan'?: MsgParamSubPlan;
  'msg-param-sub-plan-name'?: string;
  'msg-param-recipient-display-name'?: string;
  'msg-param-recipient-user-name'?: string;
  'msg-param-months'?: string;
}

export interface PrimeCommunityGiftReceivedTags extends BaseUserNoticeTags {
  'msg-id': 'primecommunitygiftreceived';
  'msg-param-sub-plan'?: MsgParamSubPlan;
  'msg-param-sub-plan-name'?: string;
  'msg-param-sender-name'?: string;
  'msg-param-months'?: string;
}

export interface AnonSubGiftTags extends BaseUserNoticeTags {
  'msg-id': 'anonsubgift';
  'msg-param-sub-plan'?: MsgParamSubPlan;
  'msg-param-recipient-display-name'?: string;
  'msg-param-recipient-user-name'?: string;
  'msg-param-months'?: string;
}

export interface AnonSubMysteryGiftTags extends BaseUserNoticeTags {
  'msg-id': 'anonsubmysterygift';
  'msg-param-mass-gift-count'?: string;
  'msg-param-sub-plan'?: MsgParamSubPlan;
  'msg-param-sub-plan-name'?: string;
}

export interface SkipSubsModeMessageTags extends BaseUserNoticeTags {
  'msg-id': 'skip-subs-mode-message';
}

export interface MidnightSquidTags extends BaseUserNoticeTags {
  'msg-id': 'midnightsquid';
}

export type UserNoticeVariantMap = {
  viewermilestone: ViewerMilestoneTags;
  sub: SubscriptionTags;
  resub: SubscriptionTags;
  subgift: SubGiftTags;
  submysterygift: SubMysteryGiftTags;
  giftpaidupgrade: GiftPaidUpgradeTags;
  anongiftpaidupgrade: AnonGiftPaidUpgradeTags;
  rewardgift: RewardGiftTags;
  raid: RaidTags;
  unraid: UnraidTags;
  bitsbadgetier: BitsBadgeTierTags;
  sharedchatnotice: SharedChatNoticeTags;
  modiversary: ModiversaryTags;
  announcement: AnnouncementTags;
  'highlighted-message': HighlightedMessageTags;
  charitydonation: CharityDonationTags;
  ritual: RitualTags;
  primepaidupgrade: PrimePaidUpgradeTags;
  extendsub: ExtendSubTags;
  standardpayforward: PayForwardTags;
  communitypayforward: PayForwardTags;
  primecommunitygiftreceived: PrimeCommunityGiftReceivedTags;
  anonsubgift: AnonSubGiftTags;
  anonsubmysterygift: AnonSubMysteryGiftTags;
  'skip-subs-mode-message': SkipSubsModeMessageTags;
  midnightsquid: MidnightSquidTags;
};

export type UserNoticeTagsByVariant<T extends keyof UserNoticeVariantMap> =
  UserNoticeVariantMap[T];

export type UserNoticeTags =
  | ViewerMilestoneTags
  | SubscriptionTags
  | SubGiftTags
  | SubMysteryGiftTags
  | GiftPaidUpgradeTags
  | AnonGiftPaidUpgradeTags
  | RewardGiftTags
  | RaidTags
  | UnraidTags
  | BitsBadgeTierTags
  | SharedChatNoticeTags
  | ModiversaryTags
  | AnnouncementTags
  | HighlightedMessageTags
  | CharityDonationTags
  | RitualTags
  | PrimePaidUpgradeTags
  | ExtendSubTags
  | PayForwardTags
  | PrimeCommunityGiftReceivedTags
  | AnonSubGiftTags
  | AnonSubMysteryGiftTags
  | SkipSubsModeMessageTags
  | MidnightSquidTags;
