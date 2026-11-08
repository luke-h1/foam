import { useCallback, useEffect, useRef } from 'react';

import * as Network from 'expo-network';

import { useSyncRef } from '@app/hooks/use-sync-ref';
import { ReadyState } from '@app/hooks/ws/constants';
import { subscribeToAppStateTransitions } from '@app/utils/app-state/appStateTransitions';
import { getHeartbeatAction } from '@app/utils/chat/chatHeartbeat';
import { logger } from '@app/utils/logger';

/**
 * Half-open sockets often fire no close event, so we PING after this much
 * silence; RN's WebSocket exposes no ping frames, so this is the only detector.
 * Inbound lines count as activity, so a busy chat never pings and this only
 * costs radio on quiet rooms.
 */
const CHAT_HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Probe deadline after foreground/network regain - much faster than waiting
 * for the next heartbeat tick.
 */
const CHAT_FOREGROUND_LIVENESS_DEADLINE_MS = 5000;

interface UseChatLivenessWatchdogOptions {
  getWebSocket: () => WebSocket;
  readyState: ReadyState;
  reconnect: () => void;
  sendPing: () => void;
  shouldConnect: boolean;
}

/**
 * Detects a dead IRC socket. A periodic probe catches a half-open socket that
 * still reports OPEN. Returning to the foreground or regaining the network
 * probes at once, without waiting for a full heartbeat cycle.
 *
 * Returns `noteActivity`, which the owner calls on open and on every inbound
 * chunk: any inbound line proves the socket is alive, and Twitch's PONG
 * arrives as a normal inbound line.
 */
export function useChatLivenessWatchdog({
  getWebSocket,
  readyState,
  reconnect,
  sendPing,
  shouldConnect,
}: UseChatLivenessWatchdogOptions): () => void {
  const lastActivityAtRef = useRef(0);

  // True while a probe PING is outstanding; surviving past the deadline means half-open.
  const awaitingPongRef = useRef(false);

  // The heartbeat and the foreground check share awaitingPongRef, so a resume tick must not kill a socket whose probe is milliseconds old.
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

    // AppState and network-regain often fire together on resume - don't stack a second probe.
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

        // Reset the marker so the next tick does not close again before the reconnect lands.
        noteActivity();
        getWebSocketRef.current().close(4002, 'chat heartbeat timeout');
        return;
      }

      // Same probe as the resume path, so the 5s deadline is armed now rather than judged next tick.
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

  // Re-verify liveness on foreground/network regain; otherwise a flapped socket takes a full heartbeat cycle to notice.
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
