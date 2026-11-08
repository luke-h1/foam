import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { useAuthContext } from '@app/context/AuthContext';
import { useLazyRef } from '@app/hooks/use-lazy-ref';
import { useSyncRef } from '@app/hooks/use-sync-ref';
import { useWebsocket } from '@app/hooks/ws/use-websocket';
import { isE2EMode } from '@app/services/api/env';
import { recordChatDebugIrcLine } from '@app/store/chat/actions/chat-debug-log';
import { usePreference } from '@app/store/preference-store';
import { IRC_RECONNECT_POLICY } from '@app/utils/async/reconnectPolicy';
import { logger } from '@app/utils/logger';

import {
  claimChatUserState,
  releaseChatUserState,
  setChatUserStateIfOwner,
} from '../util/chat-user-state';
import { buildIrcCredentials } from '../util/irc-client/buildIrcCredentials';
import {
  createIrcClient,
  type IrcClientCallbacks,
} from '../util/irc-client/createIrcClient';
import { formatIrcChannelName } from '../util/irc-client/formatIrcCommand';
import { useChatLivenessWatchdog } from './use-chat-liveness-watchdog';

const TWITCH_CHAT_URL = isE2EMode
  ? 'ws://localhost:6667'
  : 'wss://irc-ws.chat.twitch.tv:443';

function handleTwitchChatWebSocketError(error: Event) {
  logger.chat.error('💬 Twitch IRC WebSocket error:', error);
}

interface UseTwitchChatOptions extends IrcClientCallbacks {
  channel?: string;
}

export function useTwitchChat(options: UseTwitchChatOptions = {}) {
  const { channel } = options;

  // oxlint-disable-next-line react-doctor/no-event-handler -- a ref mirror the socket callbacks read; no effect fires a handler
  const optionsRef = useSyncRef(options);
  const { authState, user } = useAuthContext();
  const showJoinPartMessages = usePreference('showJoinPartMessages');
  const shouldConnect = Boolean(channel?.trim());

  const userStateOwnerRef = useLazyRef(() => Symbol('twitchChatUserState'));

  const anonymousNickRef = useLazyRef(
    () => `justinfan${Math.floor(Math.random() * 90_000) + 10_000}`,
  );

  const getWebSocketRef = useRef<() => WebSocket>(() => {
    throw new Error('useTwitchChat read the socket before useWebsocket ran');
  });

  const noteActivityRef = useRef<() => void>(() => {});

  const clientRef = useLazyRef(() =>
    createIrcClient({
      getCallbacks: () => optionsRef.current,
      getChannel: () => optionsRef.current.channel,
      onDebugLine: recordChatDebugIrcLine,
      onUserState: tags =>
        setChatUserStateIfOwner(userStateOwnerRef.current, tags),
      onServerReconnect: () => {
        noteActivityRef.current();
        getWebSocketRef.current().close(4003, 'twitch reconnect');
      },
    }),
  );

  const credentialsInputRef = useSyncRef({
    accessToken: authState?.token?.accessToken,
    login: user?.login,
    membership: showJoinPartMessages,
  });

  const handleWebSocketOpen = useCallback(() => {
    logger.chat.info('💬 Twitch IRC WebSocket connected');
    noteActivityRef.current();

    clientRef.current.handleOpen(
      buildIrcCredentials({
        ...credentialsInputRef.current,
        anonymousNick: anonymousNickRef.current,
      }),
    );
  }, [anonymousNickRef, clientRef, credentialsInputRef]);

  const handleWebSocketClose = useCallback(
    (event: CloseEvent) => {
      logger.chat.warn(
        `💬 Twitch IRC WebSocket closed: ${event.code} - ${event.reason}`,
      );
      clientRef.current.handleClose();
    },
    [clientRef],
  );

  const handleMessage = useCallback(
    (event: MessageEvent<string>) => {
      noteActivityRef.current();
      clientRef.current.handleChunk(event.data);
    },
    [clientRef],
  );

  const shouldReconnect = (event: CloseEvent) =>
    event.code !== 1000 && shouldConnect;

  const {
    getWebSocket,
    sendMessage: sendWebSocketMessage,
    readyState,
    reconnect,
  } = useWebsocket(shouldConnect ? TWITCH_CHAT_URL : null, {
    onOpen: handleWebSocketOpen,
    onMessage: handleMessage,
    onClose: handleWebSocketClose,
    onError: handleTwitchChatWebSocketError,
    shouldReconnect,
    reconnectPolicy: IRC_RECONNECT_POLICY,
  });

  const noteActivity = useChatLivenessWatchdog({
    getWebSocket,
    readyState,
    reconnect,
    sendPing: () => clientRef.current.sendCommand('PING', 'tmi.twitch.tv'),
    shouldConnect,
  });

  useLayoutEffect(() => {
    getWebSocketRef.current = getWebSocket;
    noteActivityRef.current = noteActivity;
  });

  const previousTokenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentToken = authState?.token?.accessToken;

    if (currentToken == null || !shouldConnect) {
      previousTokenRef.current = currentToken;
      return;
    }

    const previousToken = previousTokenRef.current;
    previousTokenRef.current = currentToken;

    if (previousToken !== undefined && previousToken !== currentToken) {
      logger.chat.info(
        '[useTwitchChat] Token updated, reconnecting IRC with new token',
      );
      getWebSocketRef.current().close(4001, 'auth token refreshed');
    }
  }, [authState?.token?.accessToken, shouldConnect]);

  const previousShowJoinPartRef = useRef(showJoinPartMessages);

  useEffect(() => {
    const previous = previousShowJoinPartRef.current;
    previousShowJoinPartRef.current = showJoinPartMessages;

    const isOpenChange =
      previous !== showJoinPartMessages &&
      shouldConnect &&
      getWebSocketRef.current().readyState === WebSocket.OPEN;

    if (!isOpenChange) {
      return;
    }

    logger.chat.info(
      '[useTwitchChat] Join/part preference changed, reconnecting IRC to renegotiate membership capability',
    );

    getWebSocketRef.current().close(4005, 'membership capability change');
  }, [shouldConnect, showJoinPartMessages]);

  useEffect(() => {
    const client = clientRef.current;
    client.attachTransport(sendWebSocketMessage);

    return () => client.detachTransport(sendWebSocketMessage);
  }, [clientRef, sendWebSocketMessage]);

  useEffect(() => {
    if (!shouldConnect || !clientRef.current.isAuthenticated()) {
      return;
    }

    const previousChannel = clientRef.current.getJoinedChannel();

    const channelFormatted = channel
      ? formatIrcChannelName(channel)
      : undefined;

    if (previousChannel && previousChannel !== channelFormatted) {
      clientRef.current.partChannel(previousChannel);
    }

    if (channel) {
      clientRef.current.joinChannel(channel);
    }
  }, [channel, clientRef, shouldConnect]);

  useEffect(() => {
    const client = clientRef.current;
    const owner = userStateOwnerRef.current;
    claimChatUserState(owner);

    return () => {
      logger.chat.info('[useTwitchChat] Cleaning up Twitch IRC client');
      client.dispose();
      releaseChatUserState(owner);
    };
  }, [clientRef, userStateOwnerRef]);

  const isConnected = useCallback((): boolean => {
    const client = clientRef.current;

    if (
      getWebSocket().readyState !== WebSocket.OPEN ||
      !client.isAuthenticated()
    ) {
      return false;
    }

    return channel ? client.isJoined(channel) : true;
  }, [channel, clientRef, getWebSocket]);

  const partChannel = useCallback(
    (channelName: string) => clientRef.current.partChannel(channelName),
    [clientRef],
  );

  const sendMessage = useCallback(
    (channelName: string, message: string, replyParentMsgId?: string) =>
      clientRef.current.sendPrivmsg(channelName, message, replyParentMsgId),
    [clientRef],
  );

  return {
    connectionState: readyState,
    isConnected,
    partChannel,
    reconnect,
    sendMessage,
  };
}
