import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { logger } from '@app/utils/logger';
import { useNavigationState } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { getActiveRouteName } from '../navigators/navigationUtilities';
import SevenTvWsService, {
  SevenTvEventData,
} from '../services/ws/seventv-ws-service';

export const SEVENTV_CHAT_SCREENS = ['Chat', 'LiveStream'];

interface EmoteUpdateCallbackData {
  added: SanitisiedEmoteSet[];
  removed: SanitisiedEmoteSet[];
  channelId: string;
}

interface UseSeventvWsOptions {
  onEmoteUpdate?: (data: EmoteUpdateCallbackData) => void;
  onEvent?: (eventType: string, data: SevenTvEventData) => void;
  twitchChannelId?: string;
  sevenTvEmoteSetId?: string;
}

type UseSeventvWsReturn = {
  ws: WebSocket;
  subscribeToChannel: (channelId: string) => void;
  unsubscribeFromChannel: (channelId: string) => void;
  isConnected: () => boolean;
  getConnectionState: () =>
    | 'DISCONNECTED'
    | 'CONNECTING'
    | 'CONNECTED'
    | 'CLOSING'
    | 'CLOSED'
    | 'UNKNOWN';
};

export function useSeventvWs(
  options?: UseSeventvWsOptions,
): UseSeventvWsReturn {
  const hasInitialized = useRef(false);
  const lastScreenRef = useRef<string | null>(null);
  const emoteCallbackRef = useRef(options?.onEmoteUpdate);
  const eventCallbackRef = useRef(options?.onEvent);
  const connectionTimestamp = useRef<number | null>(null);

  const twitchChannelIdRef = useRef(options?.twitchChannelId);
  const sevenTvEmoteSetIdRef = useRef(options?.sevenTvEmoteSetId);

  emoteCallbackRef.current = options?.onEmoteUpdate;
  eventCallbackRef.current = options?.onEvent;

  twitchChannelIdRef.current = options?.twitchChannelId;
  sevenTvEmoteSetIdRef.current = options?.sevenTvEmoteSetId;

  const currentScreen = useNavigationState(state => {
    if (!state) return null;
    return getActiveRouteName(state);
  });

  const subscribeToChannel = useCallback((channelId: string) => {
    SevenTvWsService.subscribeToChannel(channelId);
  }, []);

  const unsubscribeFromChannel = useCallback(() => {
    SevenTvWsService.unsubscribeFromChannel();
  }, []);

  const isConnected = useCallback(() => {
    return SevenTvWsService.isConnected();
  }, []);

  const getConnectionState = useCallback(() => {
    return SevenTvWsService.getConnectionState();
  }, []);

  useEffect(() => {
    if (!currentScreen) return;

    const isOnChatScreen = SEVENTV_CHAT_SCREENS.includes(currentScreen);
    const wasOnChatScreen = lastScreenRef.current
      ? SEVENTV_CHAT_SCREENS.includes(lastScreenRef.current)
      : false;

    logger.stvWs.info('[useSeventvWs] Screen changed:', {
      from: lastScreenRef.current,
      to: currentScreen,
      isOnChatScreen,
      wasOnChatScreen,
    });

    if (wasOnChatScreen && !isOnChatScreen) {
      logger.stvWs.info(
        '[useSeventvWs] Left chat/livestream screen, unsubscribing and disconnecting SevenTV WS',
      );
      SevenTvWsService.unsubscribeFromChannel();
      SevenTvWsService.disconnect();
      hasInitialized.current = false;
      connectionTimestamp.current = null;
    }

    lastScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    if (!currentScreen) {
      return;
    }

    const isOnChatScreen = SEVENTV_CHAT_SCREENS.includes(currentScreen);
    const hasRequiredIds =
      twitchChannelIdRef.current && sevenTvEmoteSetIdRef.current;

    logger.stvWs.info('[useSeventvWs] Checking connection requirements:', {
      isOnChatScreen,
      hasTwitchChannelId: !!twitchChannelIdRef.current,
      hasSevenTvEmoteSetId: !!sevenTvEmoteSetIdRef.current,
      hasRequiredIds,
      hasInitialized: hasInitialized.current,
    });

    if (twitchChannelIdRef.current) {
      SevenTvWsService.setTwitchChannelId(twitchChannelIdRef.current);
    }
    if (sevenTvEmoteSetIdRef.current) {
      SevenTvWsService.setSevenTVemoteSetId(sevenTvEmoteSetIdRef.current);
    }

    SevenTvWsService.setEmoteUpdateCallback(data => {
      // Skip processing emote updates during initial load to avoid historical data
      if (connectionTimestamp.current) {
        const now = Date.now();
        const timeSinceConnection = now - connectionTimestamp.current;

        // If we connected recently (less than 10 seconds ago),
        // this is likely historical data from the initial subscription
        if (timeSinceConnection < 10000) {
          // 10 seconds
          logger.stvWs.info(
            '[useSeventvWs] Skipping potential historical emote update (recent connection)',
          );
          return;
        }
      }

      if (emoteCallbackRef.current) {
        emoteCallbackRef.current(data);
      }
    });

    // Only connect if on chat screen, have required IDs, and haven't initialized yet
    if (isOnChatScreen && hasRequiredIds && !hasInitialized.current) {
      logger.stvWs.info(
        '[useSeventvWs] All requirements met, connecting SevenTV WS',
      );
      connectionTimestamp.current = Date.now(); // Record when we connected
      SevenTvWsService.getInstance();
      hasInitialized.current = true;
    }
  }, [currentScreen]); // Only depend on currentScreen

  useEffect(() => {
    return () => {
      logger.stvWs.info('[useSeventvWs] Cleaning up SevenTV WS client');
      SevenTvWsService.unsubscribeFromChannel();
      SevenTvWsService.disconnect();
      connectionTimestamp.current = null;
    };
  }, []);

  return {
    ws: SevenTvWsService.getInstance(),
    subscribeToChannel,
    unsubscribeFromChannel,
    isConnected,
    getConnectionState,
  };
}
