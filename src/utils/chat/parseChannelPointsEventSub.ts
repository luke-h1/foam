export type ParsedChannelPointsRedemption = {
  rewardId: string;
  channelId: string;
  title: string;
};

const AUTOMATIC_REWARD_TITLES: Record<string, string> = {
  SEND_ANIMATED_MESSAGE: 'Message Effects',
  SEND_GIGANTIFIED_EMOTE: 'Gigantify an Emote',
  CELEBRATION: 'On-Screen Celebration',
};

const AUTOMATIC_REWARD_IDS: Record<string, string> = {
  SEND_ANIMATED_MESSAGE: 'animated-message',
  SEND_GIGANTIFIED_EMOTE: 'gigantified-emote-message',
};

export function eventSubEventFromMessage(message: {
  event?: Record<string, unknown>;
  payload?: { event?: Record<string, unknown> };
}): Record<string, unknown> | undefined {
  return message.event ?? message.payload?.event;
}

function titleFromAutomaticRewardType(
  rewardType: string | undefined,
): string | undefined {
  if (!rewardType) {
    return undefined;
  }

  return AUTOMATIC_REWARD_TITLES[rewardType];
}

function rewardIdFromAutomaticRewardType(
  rewardType: string | undefined,
): string | undefined {
  if (!rewardType) {
    return undefined;
  }

  return AUTOMATIC_REWARD_IDS[rewardType];
}

export function parseChannelPointsEventSubEvent(
  event: Record<string, unknown>,
): ParsedChannelPointsRedemption | undefined {
  const channelId =
    typeof event.broadcaster_user_id === 'string'
      ? event.broadcaster_user_id
      : undefined;

  const reward = event.reward;
  if (!reward || typeof reward !== 'object') {
    return undefined;
  }

  const rewardRecord = reward as Record<string, unknown>;
  const rewardType =
    typeof rewardRecord.type === 'string' ? rewardRecord.type : undefined;

  let rewardId =
    typeof rewardRecord.id === 'string' ? rewardRecord.id : undefined;

  if (!rewardId && rewardType) {
    rewardId = rewardIdFromAutomaticRewardType(rewardType);
  }

  let title =
    typeof rewardRecord.title === 'string' ? rewardRecord.title.trim() : '';

  if (!title) {
    title = titleFromAutomaticRewardType(rewardType) ?? '';
  }

  if (rewardId === 'animated-message') {
    title = 'Message Effects';
  } else if (rewardId === 'gigantified-emote-message') {
    title = 'Gigantify an Emote';
  }

  if (!rewardId || !channelId || !title) {
    return undefined;
  }

  return { rewardId, channelId, title };
}
