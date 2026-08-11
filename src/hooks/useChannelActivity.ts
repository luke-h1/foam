import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useAuthContext } from '@app/context/AuthContext';
import TwitchWsService from '@app/services/twitch-ws-service';
import type { EventSubMessage } from '@app/types/twitch/eventsub';
import { logger } from '@app/utils/logger';
import type { ChannelActivity } from '@app/utils/twitch/channelActivity/channelActivity';

export function useChannelActivity<THelix, TState>(
  descriptor: ChannelActivity<THelix, TState>,
  channelId?: string,
) {
  const { authState, user } = useAuthContext();
  const [value, setValue] = useState<TState | null>(null);

  const isOwnChannel = Boolean(channelId && user?.id === channelId);
  const canSubscribe = Boolean(
    channelId && authState?.isLoggedIn && isOwnChannel,
  );
  const channelScopeKey = `${channelId ?? ''}:${isOwnChannel}`;
  const lastChannelScopeKeyRef = useRef(channelScopeKey);

  useLayoutEffect(() => {
    if (lastChannelScopeKeyRef.current !== channelScopeKey) {
      lastChannelScopeKeyRef.current = channelScopeKey;
      setValue(null);
    }
  }, [channelScopeKey]);

  useEffect(() => {
    if (!isOwnChannel || !channelId) {
      return;
    }

    let cancelled = false;

    void descriptor
      .fetch(channelId)
      .then(response => {
        if (cancelled) {
          return;
        }

        const active = response.data
          .map(descriptor.normaliseHelix)
          .find(descriptor.isActive);
        setValue(active ?? null);
      })
      .catch(error => {
        logger.twitchWs.warn(descriptor.fetchFailure.message, {
          name: descriptor.fetchFailure.name,
          error,
          action: descriptor.fetchFailure.action,
          channel_id: channelId,
          provider: 'twitch',
          screen: 'chat',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [channelId, channelScopeKey, descriptor, isOwnChannel]);

  // eslint-disable-next-line react-doctor/no-cascading-set-state -- EventSub handlers update on independent Twitch events
  useEffect(() => {
    if (!canSubscribe || !channelId) {
      return;
    }

    const handlers = descriptor.events.map(({ type, normalise }) => ({
      type,
      handler: (message: EventSubMessage) => {
        const { event } = message;
        if (!event) {
          return;
        }
        setValue(normalise(event));
      },
    }));

    TwitchWsService.getInstance();

    for (const { type, handler } of handlers) {
      void TwitchWsService.subscribeToEvent(
        type,
        '1',
        { broadcaster_user_id: channelId },
        handler,
      );
    }

    return () => {
      void Promise.all(
        handlers.map(({ type, handler }) =>
          TwitchWsService.unsubscribeFromEvent(type, handler),
        ),
      );
    };
  }, [canSubscribe, channelId, descriptor]);

  return {
    value,
    isAvailable: canSubscribe,
  };
}
