import { useNavigationState } from '@react-navigation/native';
import { useEffect, useRef, useMemo } from 'react';
import tmijs from 'tmi.js';
import { getActiveRouteName } from '../navigators/navigationUtilities';
import TmiService from '../services/tmi-service';

const CHAT_SCREENS = ['Chat', 'LiveStream'];

export function useTmiClient(options: tmijs.Options): tmijs.Client {
  const optionsRef = useRef<tmijs.Options>(null);
  const hasInitialized = useRef(false);
  const lastScreenRef = useRef<string | null>(null);

  // Track current screen using navigation state
  const currentScreen = useNavigationState(state => {
    if (!state) return null;
    return getActiveRouteName(state);
  });

  useMemo(() => {
    // Deep compare options to avoid unnecessary reconnection(s)
    const optionsChanged =
      JSON.stringify(optionsRef.current) !== JSON.stringify(options);

    if (!hasInitialized.current || optionsChanged) {
      console.log('[useTmiClient] Setting up TMI client with options:', {
        channels: options.channels,
        identity: options.identity
          ? { username: options.identity.username }
          : undefined,
        hasClientId: !!options.options?.clientId,
      });

      TmiService.setOptions({
        ...options,
        options: {
          // debug: __DEV__,
          ...options.options,
        },
        connection: {
          secure: true,
          reconnect: true,
          maxReconnectAttempts: 5,
          maxReconnectInterval: 30000,
          reconnectDecay: 1.5,
          reconnectInterval: 1000,
          ...options.connection,
        },
      });

      optionsRef.current = options;
      hasInitialized.current = true;
    }
  }, [options]);

  useEffect(() => {
    if (!currentScreen) return;

    const isOnChatScreen = CHAT_SCREENS.includes(currentScreen);
    const wasOnChatScreen = lastScreenRef.current
      ? CHAT_SCREENS.includes(lastScreenRef.current)
      : false;

    console.log('[useTmiClient] Screen changed:', {
      from: lastScreenRef.current,
      to: currentScreen,
      isOnChatScreen,
      wasOnChatScreen,
    });

    // If we moved from a chat screen to a non-chat screen, disconnect
    if (wasOnChatScreen && !isOnChatScreen) {
      console.log(
        '[useTmiClient] Left chat/livestream screen, disconnecting TMI',
      );
      void TmiService.disconnect();
    }
    // If we moved from a non-chat screen to a chat screen, ensure connection
    else if (!wasOnChatScreen && isOnChatScreen) {
      console.log(
        '[useTmiClient] Entered chat/livestream screen, ensuring TMI connection',
      );
      void TmiService.connect();
    }

    lastScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    // Cleanup function - only disconnect if we're not in development
    return () => {
      console.log('[useTmiClient] Cleaning up TMI client');
      // if (!__DEV__) {
      // Only disconnect in production to avoid issues with hot reload
      void TmiService.disconnect();
      // }
    };
  }, []);

  // Return the singleton instance - options are now guaranteed to be set
  return TmiService.getInstance();
}
