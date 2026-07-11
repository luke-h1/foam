export type ChannelPointsRewardTags = Record<
  string,
  string | boolean | undefined
>;

export type ChannelPointsRewardTagSource = {
  'msg-id'?: string;
  'msg-param-custom-reward-title'?: string;
  'msg-param-reward-title'?: string;
  'system-msg'?: string;
  'custom-reward-id'?: string;
  'room-id'?: string;
};

export type RewardTitleTagSource = ChannelPointsRewardTagSource;
