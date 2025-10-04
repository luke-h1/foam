import { logger } from '@app/utils/logger';
import { useNavigationState } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { getActiveRouteName } from '../navigators/navigationUtilities';
import TwitchWsService from '../services/twitch-ws-service';
import { CHAT_SCREENS } from './useTmiClient';

export function useTwitchWs(): WebSocket {
  const hasInitialized = useRef(false);
  const lastScreenRef = useRef<string | null>(null);

  const currentScreen = useNavigationState(state => {
    if (!state) return null;
    return getActiveRouteName(state);
  });

  useEffect(() => {
    if (!currentScreen) return;

    const isOnChatScreen = CHAT_SCREENS.includes(currentScreen);
    const wasOnChatScreen = lastScreenRef.current
      ? CHAT_SCREENS.includes(lastScreenRef.current)
      : false;

    logger.twitchWs.info('[useTwitchWs] Screen changed:', {
      from: lastScreenRef.current,
      to: currentScreen,
      isOnChatScreen,
      wasOnChatScreen,
    });

    if (wasOnChatScreen && !isOnChatScreen) {
      logger.twitchWs.info(
        '[useTwitchWs] Left chat/livestream screen, disconnecting WS',
      );
      void TwitchWsService.disconnect();
    } else if (!wasOnChatScreen && isOnChatScreen) {
      logger.twitchWs.info(
        '[useTwitchWs] Entered chat/livestream screen, ensuring WS connection',
      );
      void TwitchWsService.getInstance();
      hasInitialized.current = true;
    }

    lastScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    // Cleanup function
    return () => {
      logger.twitchWs.info('[useTwitchWs] Cleaning up Twitch WS client');
      void TwitchWsService.disconnect();
    };
  }, []);

  // Return the singleton instance
  return TwitchWsService.getInstance();
}
