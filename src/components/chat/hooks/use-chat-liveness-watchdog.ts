import { useCallback, useEffect, useRef } from 'react';

import * as Network from 'expo-network';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import { ReadyState } from '@app/hooks/ws/constants';
import { subscribeToAppStateTransitions } from '@app/utils/app-state/appStateTransitions';
import { getHeartbeatAction } from '@app/utils/chat/chatHeartbeat';
import { logger } from '@app/utils/logger';

const CHAT_HEARTBEAT_INTERVAL_MS = 60_000;

const CHAT_FOREGROUND_LIVENESS_DEADLINE_MS = 5000;

interface UseChatLivenessWatchdogOptions {
  getWebSocket: () => WebSocket;
  readyState: ReadyState;
  reconnect: () => void;
  sendPing: () => void;
  shouldConnect: boolean;
}

export function useChatLivenessWatchdog({
  getWebSocket,
  readyState,
  reconnect,
  sendPing,
  shouldConnect,
}: UseChatLivenessWatchdogOptions): () => void {
  const lastActivityAtRef = useRef(0);

  const awaitingPongRef = useRef(false);

  const probeSentAtRef = useRef(0);

  const probeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyStateRef = useSyncRef(readyState);
  const getWebSocketRef = useSyncRef(getWebSocket);
  const reconnectRef = useSyncRef(reconnect);
  const sendPingRef = useSyncRef(sendPing);
  const shouldConnectRef = useSyncRef(shouldConnect);

  const noteActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now();
    awaitingPongRef.current = false;
  }, []);

  const verifyChatLiveness = () => {
    if (!shouldConnectRef.current) {
      return;
    }

    const socket = getWebSocketRef.current();

    if (socket.readyState !== WebSocket.OPEN) {
      logger.chat.info(
        '💬 Twitch IRC not open on resume, restarting connection',
      );

      reconnectRef.current();
      return;
    }

    if (awaitingPongRef.current) {
      return;
    }

    awaitingPongRef.current = true;
    const sentAt = Date.now();
    probeSentAtRef.current = sentAt;
    sendPingRef.current();

    if (probeTimeoutRef.current) {
      clearTimeout(probeTimeoutRef.current);
    }

    probeTimeoutRef.current = setTimeout(() => {
      probeTimeoutRef.current = null;

      const isStale =
        !shouldConnectRef.current ||
        !awaitingPongRef.current ||
        probeSentAtRef.current !== sentAt;

      const currentSocket = getWebSocketRef.current();

      if (isStale || currentSocket.readyState !== WebSocket.OPEN) {
        return;
      }

      logger.chat.warn(
        '💬 Twitch IRC liveness probe unanswered after resume, forcing reconnect',
        { name: 'twitch_chat_warning' },
      );

      noteActivity();
      currentSocket.close(4004, 'chat liveness probe timeout');
    }, CHAT_FOREGROUND_LIVENESS_DEADLINE_MS);
  };

  const verifyChatLivenessRef = useSyncRef(verifyChatLiveness);

  useEffect(() => {
    if (!shouldConnect) {
      return;
    }

    const interval = setInterval(() => {
      const action = getHeartbeatAction({
        isOpen: readyStateRef.current === ReadyState.OPEN,
        awaitingPong: awaitingPongRef.current,
        msSinceProbeSent: awaitingPongRef.current
          ? Date.now() - probeSentAtRef.current
          : null,
        msSinceLastActivity: Date.now() - lastActivityAtRef.current,
        intervalMs: CHAT_HEARTBEAT_INTERVAL_MS,
        probeDeadlineMs: CHAT_FOREGROUND_LIVENESS_DEADLINE_MS,
      });

      if (action === 'wait') {
        return;
      }

      if (action === 'reconnect') {
        logger.chat.warn(
          '💬 Twitch IRC PING unanswered past heartbeat, forcing reconnect',
          {
            name: 'twitch_chat_warning',
            idleMs: Date.now() - lastActivityAtRef.current,
          },
        );

        noteActivity();
        getWebSocketRef.current().close(4002, 'chat heartbeat timeout');
        return;
      }

      verifyChatLivenessRef.current();
    }, CHAT_HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [
    getWebSocketRef,
    noteActivity,
    readyStateRef,
    shouldConnect,
    verifyChatLivenessRef,
  ]);

  useEffect(() => {
    if (!shouldConnect) {
      return;
    }

    const unsubscribeAppState = subscribeToAppStateTransitions(
      ({ previous, current }) => {
        if (current === 'active' && previous !== 'active') {
          verifyChatLivenessRef.current();
        }
      },
    );

    let wasConnected = true;

    void Network.getNetworkStateAsync()
      .then(state => {
        wasConnected = Boolean(state.isConnected);
      })
      .catch((error: unknown) => {
        logger.chat.debug(
          'Could not read the network state; assuming connected',
          error,
        );
      });

    const networkSubscription = Network.addNetworkStateListener(state => {
      const isConnected = Boolean(state.isConnected);

      if (isConnected && !wasConnected) {
        verifyChatLivenessRef.current();
      }

      wasConnected = isConnected;
    });

    return () => {
      unsubscribeAppState();
      networkSubscription.remove();

      if (probeTimeoutRef.current) {
        clearTimeout(probeTimeoutRef.current);
        probeTimeoutRef.current = null;
      }
    };
  }, [shouldConnect, verifyChatLivenessRef]);

  return noteActivity;
}
