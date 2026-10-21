export type ChannelPointsRewardTags = Record<
  string,
  string | boolean | undefined
>;

export type ChannelPointsRewardTagSource = {
  'msg-id'?: string | undefined;
  'msg-param-custom-reward-title'?: string | undefined;
  'msg-param-reward-title'?: string | undefined;
  'system-msg'?: string | undefined;
  'custom-reward-id'?: string | undefined;
  'room-id'?: string | undefined;
};
