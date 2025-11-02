import { useNavigationState } from '@react-navigation/native';
import { useEffect, useRef, useMemo, useState } from 'react';
import tmijs from 'tmi.js';
import { getActiveRouteName } from '../navigators/navigationUtilities';

export const CHAT_SCREENS = ['Chat', 'LiveStream'];

let clientInstance: tmijs.Client | null = null;
let clientOptions: tmijs.Options | null = null;
let isConnected = false;

export function useTmiClient(options: tmijs.Options): tmijs.Client {
  const optionsRef = useRef<tmijs.Options | null>(null);
  const hasInitialized = useRef(false);
  const lastScreenRef = useRef<string | null>(null);
  const [, forceUpdate] = useState({});

  const currentScreen = useNavigationState(state => {
    if (!state) return null;
    return getActiveRouteName(state);
  });

  useMemo(() => {
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

      const mergedOptions: tmijs.Options = {
        ...options,
        options: {
          // debug: __DEV__,
          skipMembership: true,
          skipUpdatingEmotesets: true,
          updateEmotesetsTimer: 10000,
          joinInterval: 1000,
          ...options.options,
        },
        connection: {
          secure: true,
          reconnect: true,
          reconnectInterval: 1000,
          ...options.connection,
        },
      };

      if (clientInstance && optionsChanged) {
        console.log('[useTmiClient] Options changed, disconnecting old client');
        void clientInstance.disconnect();
        clientInstance = null;
        isConnected = false;
      }

      if (!clientInstance) {
        clientInstance = new tmijs.Client(mergedOptions);
        clientOptions = mergedOptions;

        clientInstance.on('connected', () => {
          console.log('[useTmiClient] Client connected');
          isConnected = true;
          forceUpdate({});
        });

        clientInstance.on('disconnected', reason => {
          console.log('[useTmiClient] Client disconnected:', reason);
          isConnected = false;
          forceUpdate({});
        });
      }

      optionsRef.current = options;
      hasInitialized.current = true;
    }
  }, [options]);

  useEffect(() => {
    if (!currentScreen || !clientInstance) return;

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
      void clientInstance.disconnect();
    }
    // If we moved from a non-chat screen to a chat screen, ensure connection
    else if (!wasOnChatScreen && isOnChatScreen) {
      console.log(
        '[useTmiClient] Entered chat/livestream screen, ensuring TMI connection',
      );
      if (!isConnected) {
        void clientInstance.connect();
      }
    }

    lastScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    // Cleanup function - only disconnect if we're not in development
    return () => {
      console.log('[useTmiClient] Cleaning up TMI client');
      if (clientInstance) {
        void clientInstance.disconnect();
      }
    };
  }, []);

  // Return the singleton instance - options are now guaranteed to be set
  if (!clientInstance) {
    throw new Error('TMI client not initialized');
  }
  return clientInstance;
}

// Helper functions for use outside the hook (like in Chat.tsx)
export function getTmiClient(): tmijs.Client | null {
  return clientInstance;
}

export function isTmiClientConnected(): boolean {
  if (!clientInstance) return false;
  return isConnected;
}

export async function connectTmiClient(): Promise<void> {
  if (!clientInstance) {
    throw new Error('TMI client not initialized');
  }
  if (!isConnected) {
    await clientInstance.connect();
  }
}

export async function disconnectTmiClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.disconnect();
  }
}

export function setTmiClientOptions(options: tmijs.Options): void {
  const mergedOptions: tmijs.Options = {
    ...options,
    options: {
      skipMembership: true,
      skipUpdatingEmotesets: true,
      updateEmotesetsTimer: 10000,
      joinInterval: 1000,
      ...options.options,
    },
    connection: {
      secure: true,
      reconnect: true,
      reconnectInterval: 1000,
      ...options.connection,
    },
  };

  // If client exists and options changed, disconnect the old one
  if (clientInstance) {
    const optionsChanged =
      JSON.stringify(clientOptions) !== JSON.stringify(mergedOptions);
    if (optionsChanged) {
      console.log('[setTmiClientOptions] Options changed, recreating client');
      void clientInstance.disconnect();
      clientInstance = null;
      isConnected = false;
    }
  }

  // Create new client if it doesn't exist
  if (!clientInstance) {
    clientInstance = new tmijs.Client(mergedOptions);
    clientOptions = mergedOptions;
    isConnected = false;

    // Set up connection state tracking
    clientInstance.on('connected', () => {
      console.log('[setTmiClientOptions] Client connected');
      isConnected = true;
    });

    clientInstance.on('disconnected', reason => {
      console.log('[setTmiClientOptions] Client disconnected:', reason);
      isConnected = false;
    });
  }
}
