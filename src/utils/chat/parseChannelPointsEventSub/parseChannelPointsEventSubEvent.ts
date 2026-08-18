import { z } from 'zod';

export type ParsedChannelPointsRedemption = {
  rewardId: string;
  channelId: string;
  title: string;
};

export interface ChannelPointsEventSubEvent {
  broadcaster_user_id?: unknown;
  reward?: unknown;
}

const AUTOMATIC_REWARD_TITLES = new Map([
  ['SEND_ANIMATED_MESSAGE', 'Message Effects'],
  ['SEND_GIGANTIFIED_EMOTE', 'Gigantify an Emote'],
  ['CELEBRATION', 'On-Screen Celebration'],
]);

const AUTOMATIC_REWARD_IDS = new Map([
  ['SEND_ANIMATED_MESSAGE', 'animated-message'],
  ['SEND_GIGANTIFIED_EMOTE', 'gigantified-emote-message'],
]);

const channelPointsEventSchema = z.object({
  broadcaster_user_id: z.string().optional().catch(undefined),
  reward: z
    .object({
      id: z.string().optional().catch(undefined),
      title: z.string().optional().catch(undefined),
      type: z.string().optional().catch(undefined),
    })
    .optional()
    .catch(undefined),
});

function titleFromAutomaticRewardType(
  rewardType: string | undefined,
): string | undefined {
  if (!rewardType) {
    return undefined;
  }

  return AUTOMATIC_REWARD_TITLES.get(rewardType);
}

function rewardIdFromAutomaticRewardType(
  rewardType: string | undefined,
): string | undefined {
  if (!rewardType) {
    return undefined;
  }

  return AUTOMATIC_REWARD_IDS.get(rewardType);
}

export function parseChannelPointsEventSubEvent(
  event: ChannelPointsEventSubEvent,
): ParsedChannelPointsRedemption | undefined {
  const parsed = channelPointsEventSchema.safeParse(event);
  if (!parsed.success) {
    return undefined;
  }

  const channelId = parsed.data.broadcaster_user_id;
  const reward = parsed.data.reward;
  if (!reward) {
    return undefined;
  }

  const rewardType = reward.type;

  let rewardId = reward.id;
  if (!rewardId && rewardType) {
    rewardId = rewardIdFromAutomaticRewardType(rewardType);
  }

  let title = reward.title?.trim() ?? '';
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
