import type { SevenTvWsMessage } from '@app/types/seventv/cosmetics';
import { logger } from '@app/utils/logger';
import type { SeventvSessionState } from '@app/utils/seventv/seventvSessionState';
import {
  buildCosmeticCreateSubscribeMessage,
  buildEmoteSetUpdateSubscribeMessage,
  buildEntitlementCreateSubscribeMessage,
  buildUserUpdateSubscribeMessage,
} from '@app/utils/seventv/seventvWsInterpreter';

export const ID_WAIT_TIMEOUT = 30000; // 30 seconds

type SeventvSubscribeMessage = SevenTvWsMessage<
  never,
  'cosmetic.create' | 'emote_set.update' | 'entitlement.create' | 'user.update'
>;

export interface SetupInitialSubscriptionsOptions {
  session: SeventvSessionState;
  sendJsonMessage: (message: SeventvSubscribeMessage) => void;
  getTwitchChannelId: () => string | undefined;
  getSevenTvChannelUserId: () => string | undefined;
  getSevenTvEmoteSetId: () => string | undefined;
}

/**
 * The initial-subscription pass for a fresh 7TV socket: waits (up to 30s) for
 * the channel and emote-set ids to resolve, then subscribes the
 * channel-scoped streams and the emote set, recording what it subscribed on
 * the session state. Every wait iteration is fenced by
 * `session.beginSubscriptionRun()` - a session reset or channel hop mid-poll
 * makes the run bail without subscribing or marking the session initialised.
 */
export const setupInitialSubscriptions = async ({
  getSevenTvChannelUserId,
  getSevenTvEmoteSetId,
  getTwitchChannelId,
  sendJsonMessage,
  session,
}: SetupInitialSubscriptionsOptions): Promise<void> => {
  const stillCurrent = session.beginSubscriptionRun();

  let waitStartTime = Date.now();

  while (
    !getTwitchChannelId() &&
    Date.now() - waitStartTime < ID_WAIT_TIMEOUT
  ) {
    logger.stvWs.debug('💚 Waiting for twitchChannelId to be set...');
    // eslint-disable-next-line react-doctor/async-await-in-loop, react-doctor/async-defer-await -- poll until channel id is available; the fence below checks state that can only go stale DURING this await
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    if (!stillCurrent()) {
      return;
    }
  }

  if (!stillCurrent()) {
    return;
  }

  const twitchChannelId = getTwitchChannelId();
  if (twitchChannelId) {
    sendJsonMessage(
      buildEntitlementCreateSubscribeMessage(twitchChannelId, Date.now()),
    );
    sendJsonMessage(
      buildCosmeticCreateSubscribeMessage(twitchChannelId, Date.now()),
    );
    session.subscribedChannelId = twitchChannelId;
    logger.stvWs.info(
      '💚 Subscribed to entitlement.create and cosmetic.create events',
    );
    logger.stvWs.info(
      '💚 Note: update/delete events will be handled through general event stream',
    );
  }

  const sevenTvChannelUserId = getSevenTvChannelUserId();
  if (sevenTvChannelUserId) {
    sendJsonMessage(buildUserUpdateSubscribeMessage(sevenTvChannelUserId));
    session.subscribedOwnerId = sevenTvChannelUserId;
    logger.stvWs.info('💚 Subscribed to channel owner user.update events');
  }

  waitStartTime = Date.now();

  while (
    !getSevenTvEmoteSetId() &&
    Date.now() - waitStartTime < ID_WAIT_TIMEOUT
  ) {
    logger.stvWs.debug('💚 Waiting for sevenTVemoteSetId to be set...');
    // eslint-disable-next-line react-doctor/async-await-in-loop, react-doctor/async-defer-await -- poll until emote set id is available; the fence below checks state that can only go stale DURING this await
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    if (!stillCurrent()) {
      return;
    }
  }

  if (!stillCurrent()) {
    return;
  }

  const sevenTvEmoteSetId = getSevenTvEmoteSetId();
  if (sevenTvEmoteSetId) {
    sendJsonMessage(
      buildEmoteSetUpdateSubscribeMessage(sevenTvEmoteSetId, Date.now()),
    );
    logger.stvWs.info('💚 Subscribed to emote_set.update events');
  }

  session.hasInitialSubscriptions = true;
};
