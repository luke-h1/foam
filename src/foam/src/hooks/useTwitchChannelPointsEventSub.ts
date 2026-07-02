import { useEffect } from 'react';

import { useAuthContext } from '@app/context/AuthContext';
import TwitchWsService from '@app/services/twitch-ws-service';
import type { TwitchEventSubCallback } from '@app/types/twitch/eventsub';
import { cacheChannelPointRewardTitle } from '@app/utils/chat/channelPointRewardTitleStore';
import {
  eventSubEventFromMessage,
  parseChannelPointsEventSubEvent,
} from '@app/utils/chat/parseChannelPointsEventSub';
import { logger } from '@app/utils/logger';

const CUSTOM_REWARD_REDEMPTION_EVENT =
  'channel.channel_points_custom_reward_redemption.add';
const AUTOMATIC_REWARD_REDEMPTION_EVENT =
  'channel.channel_points_automatic_reward_redemption.add';

const handleChannelPointsRedemption: TwitchEventSubCallback = message => {
  const event = eventSubEventFromMessage(message);
  if (!event) {
    return;
  }

  const redemption = parseChannelPointsEventSubEvent(event);
  if (!redemption) {
    return;
  }

  cacheChannelPointRewardTitle(
    redemption.channelId,
    redemption.rewardId,
    redemption.title,
  );
  logger.chat.debug('Cached channel point reward from EventSub', {
    rewardId: redemption.rewardId,
    title: redemption.title,
  });
};

export function useTwitchChannelPointsEventSub(channelId: string | undefined) {
  const { authState, user } = useAuthContext();
  const canSubscribe = Boolean(
    channelId && authState?.isLoggedIn && user?.id === channelId,
  );

  useEffect(() => {
    if (!canSubscribe || !channelId) {
      return;
    }

    const condition = { broadcaster_user_id: channelId };

    TwitchWsService.getInstance();

    void TwitchWsService.subscribeToEvent(
      CUSTOM_REWARD_REDEMPTION_EVENT,
      '1',
      condition,
      handleChannelPointsRedemption,
    );
    void TwitchWsService.subscribeToEvent(
      AUTOMATIC_REWARD_REDEMPTION_EVENT,
      '1',
      condition,
      handleChannelPointsRedemption,
    );

    logger.chat.debug('Twitch EventSub listening for channel point rewards', {
      channelId,
    });

    return () => {
      void Promise.all([
        TwitchWsService.unsubscribeFromEvent(
          CUSTOM_REWARD_REDEMPTION_EVENT,
          handleChannelPointsRedemption,
        ),
        TwitchWsService.unsubscribeFromEvent(
          AUTOMATIC_REWARD_REDEMPTION_EVENT,
          handleChannelPointsRedemption,
        ),
      ]);
    };
  }, [canSubscribe, channelId]);
}
