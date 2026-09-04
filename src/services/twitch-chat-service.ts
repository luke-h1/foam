import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import * as Network from 'expo-network';

import { useAuthContext } from '@app/context/AuthContext';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { useSyncRef } from '@app/hooks/useSyncRef';
import { chatPerfMarks } from '@app/lib/chatPerfMarks';
import { isE2EMode } from '@app/services/api/clients';
import { recordChatDebugIrcLine } from '@app/store/chat/actions/chatDebugLog';
import { usePreference } from '@app/store/preferenceStore';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';
import { applyAntiDuplicateSuffix } from '@app/utils/chat/applyAntiDuplicateSuffix';
import { getHeartbeatAction } from '@app/utils/chat/chatHeartbeat';
import { shouldProcessLiveMessage } from '@app/utils/chat/chatIngestRateLimiter';
import { containsMutedWords } from '@app/utils/chat/chatMessageFilters/containsMutedWords';
import { isUserBlocked } from '@app/utils/chat/chatMessageFilters/isUserBlocked';
import { buildPrivmsgLine } from '@app/utils/chat/ircProtocol/buildPrivmsgLine';
import { isPrivmsgLine } from '@app/utils/chat/ircProtocol/isPrivmsgLine';
import {
  type IrcMessage,
  parseIrcMessage,
} from '@app/utils/chat/ircProtocol/parseIrcMessage';
import {
  type IrcRouteHandlers,
  routeIrcMessage,
} from '@app/utils/chat/ircProtocol/routeIrcMessage';
import { logger } from '@app/utils/logger';

import { ReadyState } from '../hooks/ws/constants';
import { useWebsocket } from '../hooks/ws/useWebsocket';

/**
 * Module-level external store for the IRC userstate; each USERSTATE replaces
 * the record wholesale.
 */
let currentUserState: Record<string, string> = {};
const userStateListeners = new Set<() => void>();

/**
 * Owner token: a channel switch mounts the next hook before the old one's
 * cleanup, so ownership gating stops the departing channel clobbering the new state.
 */
let currentUserStateOwner: symbol | null = null;

function setCurrentUserState(next: Record<string, string>): void {
  currentUserState = next;
  userStateListeners.forEach(listener => listener());
}

function setCurrentUserStateIfOwner(
  token: symbol,
  next: Record<string, string>,
): void {
  if (currentUserStateOwner !== token) {
    return;
  }
  setCurrentUserState(next);
}

function subscribeUserState(listener: () => void): () => void {
  userStateListeners.add(listener);
  return () => {
    userStateListeners.delete(listener);
  };
}

export function getChatUserState(): Record<string, string> {
  return currentUserState;
}

/**
 * Reactive view over the userstate: re-renders when USERSTATE or
 * GLOBALUSERSTATE arrives.
 */
export function useChatUserState(): Record<string, string> {
  return useSyncExternalStore(subscribeUserState, getChatUserState);
}

/**
 * Half-open sockets often fire no close event, so we PING after this much
 * silence; RN's WebSocket exposes no ping frames, so this is the only detector.
 */
const CHAT_HEARTBEAT_INTERVAL_MS = 30_000;
/**
 * Probe deadline after foreground/network regain - much faster than waiting
 * for the next heartbeat tick.
 */
const CHAT_FOREGROUND_LIVENESS_DEADLINE_MS = 5_000;

const TWITCH_CHAT_URL = isE2EMode
  ? 'ws://localhost:6667'
  : 'wss://irc-ws.chat.twitch.tv:443';

function formatIrcChannelName(channelName: string): string {
  return channelName.startsWith('#') ? channelName : `#${channelName}`;
}

function handleTwitchChatWebSocketError(error: Event) {
  logger.chat.error('💬 Twitch IRC WebSocket error:', error);
}

interface UseTwitchChatOptions {
  channel?: string;
  onMessage?: (
    channel: string,
    tags: Record<string, string>,
    message: string,
  ) => void;
  onJoin?: (channel: string) => void;
  onPart?: (channel: string) => void;
  onUserJoin?: (channel: string, username: string) => void;
  onUserPart?: (channel: string, username: string) => void;
  onNotice?: (
    channel: string,
    tags: Record<string, string>,
    message: string,
  ) => void;
  onReconnect?: () => void;
  onUserNotice?: (
    channel: string,
    tags: UserNoticeTags,
    message: string,
  ) => void;
  onClearChat?: (
    channel: string,
    tags: Record<string, string>,
    username?: string,
    banDuration?: number,
  ) => void;
  onClearMessage?: (
    channel: string,
    tags: Record<string, string>,
    targetMsgId: string,
  ) => void;
  onRoomState?: (channel: string, tags: Record<string, string>) => void;
  onUserState?: (channel: string, tags: Record<string, string>) => void;
  onGlobalUserState?: (tags: Record<string, string>) => void;
  onWelcome?: () => void;
  blockedUsers?: { userLogin: string }[];
  mutedWords?: string[];
  matchWholeWord?: boolean;
  onUserStateAfterSend?: (tags: Record<string, string>) => void;
}

export function useTwitchChat(options: UseTwitchChatOptions = {}) {
  const optionsRef = useSyncRef(options);
  const { authState, user } = useAuthContext();
  const showJoinPartMessages = usePreference('showJoinPartMessages');
  const showJoinPartMessagesRef = useSyncRef(showJoinPartMessages);
  const {
    blockedUsers = [],
    channel,
    matchWholeWord = false,
    mutedWords = [],
    // eslint-disable-next-line react-doctor/no-event-handler -- data fields; handlers go through optionsRef
  } = options;

  const isAuthenticatedRef = useRef(false);
  const userStateTokenRef = useLazyRef(() => Symbol('twitchChatUserState'));
  const joinedChannelsRef = useLazyRef(() => new Set<string>());
  const pendingJoinChannelsRef = useLazyRef(() => new Set<string>());
  const anonymousNickRef = useLazyRef(
    () => `justinfan${Math.floor(Math.random() * 90000) + 10000}`,
  );
  // Authenticated nick; JOIN/PART prefixes let us tell our own join/part from other chatters'.
  const currentNickRef = useRef('');
  const pendingIrcMessagesRef = useRef<string[]>([]);
  // Seeded on open and refreshed on every inbound line; the heartbeat only
  // reads it once readyState is OPEN, by which point onOpen has set it.
  const lastActivityAtRef = useRef(0);
  // True while a probe PING is outstanding; any inbound line clears it, surviving past the deadline means half-open.
  const awaitingPongRef = useRef(false);
  // When the probe was sent; the heartbeat and foreground check share awaitingPongRef, so a resume tick must not kill a socket whose probe is milliseconds old.
  const probeSentAtRef = useRef(0);
  const probeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendIrcMessageRef = useRef<((message: string) => void) | null>(null);
  const messageBufferRef = useRef<string>('');
  const pendingMessageRef = useRef<{
    channel: string;
    message: string;
    replyParentMsgId?: string;
    replyParentDisplayName?: string;
    replyParentMsgBody?: string;
  } | null>(null);
  /**
   * What was last put on the wire per channel, so a repeat can be made distinct
   * before Twitch's duplicate filter swallows it.
   */
  const lastSentMessagesRef = useLazyRef(() => new Map<string, string>());

  const shouldConnect = Boolean(channel?.trim());

  const previousTokenRef = useRef<string | undefined>(undefined);

  const sendIrcCommand = useCallback((command: string, ...params: string[]) => {
    let message = command;
    if (params.length > 0) {
      const lastParam = params[params.length - 1];

      if (lastParam) {
        const hasSpaces = lastParam.includes(' ');
        const trailingParams = params
          .slice(0, -1)
          .filter((p): p is string => !!p);

        if (trailingParams.length > 0) {
          message = `${message} ${trailingParams.join(' ')}`;
        }

        if (hasSpaces) {
          message = `${message} :${lastParam}`;
        } else {
          message = `${message} ${lastParam}`;
        }
      }
    }

    logger.chat.debug(`Sending IRC command: ${message}`);
    const payload = `${message}\r\n`;
    const sendMessageFn = sendIrcMessageRef.current;
    if (!sendMessageFn) {
      pendingIrcMessagesRef.current.push(payload);
      return;
    }

    sendMessageFn(payload);
  }, []);

  // A JOIN/PART with no prefix, or one matching the nick we authenticated with,
  // is our own connection; anything else is another chatter.
  const isSelfNick = (nick: string | undefined) =>
    !nick ||
    !currentNickRef.current ||
    nick.toLowerCase() === currentNickRef.current.toLowerCase();

  const markChannelJoined = (channelName: string) => {
    const channelFormatted = formatIrcChannelName(channelName);
    pendingJoinChannelsRef.current.delete(channelFormatted);
    joinedChannelsRef.current.add(channelFormatted);
    return channelFormatted;
  };

  const joinChannel = useCallback(
    (channelName: string) => {
      if (!channelName) {
        return;
      }

      const channelFormatted = formatIrcChannelName(channelName);

      if (joinedChannelsRef.current.has(channelFormatted)) {
        logger.chat.debug(`Already joined channel: ${channelFormatted}`);
        return;
      }
      if (pendingJoinChannelsRef.current.has(channelFormatted)) {
        logger.chat.debug(
          `Join already pending for channel: ${channelFormatted}`,
        );
        return;
      }

      logger.chat.info(`Joining channel: ${channelFormatted}`);
      pendingJoinChannelsRef.current.add(channelFormatted);
      sendIrcCommand('JOIN', channelFormatted);
    },
    [joinedChannelsRef, pendingJoinChannelsRef, sendIrcCommand],
  );

  const authenticate = useCallback(() => {
    const hasUserLogin = Boolean(user?.login?.trim());
    const accessToken = authState?.token?.accessToken?.trim();
    const canUseAuthenticatedChat = hasUserLogin && Boolean(accessToken);

    const nickname = canUseAuthenticatedChat
      ? (user?.login?.trim() ?? anonymousNickRef.current)
      : anonymousNickRef.current;
    const passToken = canUseAuthenticatedChat
      ? `oauth:${accessToken}`
      : 'SCHMOOPIIE';

    currentNickRef.current = nickname;

    logger.chat.info(
      canUseAuthenticatedChat
        ? 'Authenticating with Twitch IRC...'
        : `Authenticating anonymously with Twitch IRC as ${nickname}...`,
    );

    if (hasUserLogin && !canUseAuthenticatedChat) {
      logger.chat.warn(
        '[useTwitchChat] Missing auth token, falling back to anonymous IRC mode',
      );
    }

    const capabilities = showJoinPartMessagesRef.current
      ? 'twitch.tv/tags twitch.tv/commands twitch.tv/membership'
      : 'twitch.tv/tags twitch.tv/commands';
    sendIrcCommand(`CAP REQ :${capabilities}`);
    sendIrcCommand('PASS', passToken);
    sendIrcCommand('NICK', nickname);

    if (channel) {
      setTimeout(() => {
        if (isAuthenticatedRef.current) {
          joinChannel(channel);
        }
      }, 250);
    }
  }, [
    anonymousNickRef,
    authState,
    channel,
    joinChannel,
    sendIrcCommand,
    showJoinPartMessagesRef,
    user,
  ]);

  const partChannel = (channelName: string) => {
    if (!channelName) {
      return;
    }

    const channelFormatted = formatIrcChannelName(channelName);

    if (
      !joinedChannelsRef.current.has(channelFormatted) &&
      !pendingJoinChannelsRef.current.has(channelFormatted)
    ) {
      return;
    }

    logger.chat.info(`Parting from channel: ${channelFormatted}`);
    sendIrcCommand('PART', channelFormatted);
    joinedChannelsRef.current.delete(channelFormatted);
    pendingJoinChannelsRef.current.delete(channelFormatted);
    optionsRef.current.onPart?.(channelFormatted);
  };

  const ircRouteHandlers: IrcRouteHandlers = {
    motd: (command, params) => {
      logger.chat.debug(`IRC ${command}: ${params.join(' ')}`);
    },

    welcome: () => {
      isAuthenticatedRef.current = true;
      logger.chat.info('✅ Authenticated with Twitch IRC');

      if (channel) {
        joinChannel(channel);
      }
    },

    ping: server => {
      logger.chat.debug(`Received PING, sending PONG to ${server}`);
      sendIrcCommand('PONG', server);
    },

    privmsg: (channelName, tagsRecord, messageText) => {
      const username = tagsRecord['display-name'] || tagsRecord.login;

      // Skip the per-message lowercasing when there is no blocklist.
      if (blockedUsers.length > 0) {
        const isMod = tagsRecord.mod === '1';
        const isChannelOwner =
          channelName.slice(1).toLowerCase() === user?.login?.toLowerCase();

        if (
          !isMod &&
          !isChannelOwner &&
          isUserBlocked(username, blockedUsers)
        ) {
          logger.chat.debug(`Filtered message from blocked user: ${username}`);
          return;
        }
      }

      if (containsMutedWords(messageText, mutedWords, matchWholeWord)) {
        logger.chat.debug(`Filtered message containing muted words`);
        return;
      }

      optionsRef.current.onMessage?.(channelName, tagsRecord, messageText);
    },

    reconnect: () => {
      logger.chat.warn('Received Twitch IRC RECONNECT request');
      optionsRef.current.onReconnect?.();
      lastActivityAtRef.current = Date.now();
      getWebSocketRef.current().close(4003, 'twitch reconnect');
    },

    notice: (channelName, tagsRecord, messageText) => {
      if (messageText.includes('Welcome, GLHF!')) {
        logger.chat.info('✅ Welcome message received');
        optionsRef.current.onWelcome?.();
      }

      logger.chat.info(`NOTICE in ${channelName}: ${messageText}`);
      optionsRef.current.onNotice?.(channelName, tagsRecord, messageText);
    },

    channellessNotice: messageText => {
      if (messageText.includes('Welcome, GLHF!')) {
        logger.chat.info('✅ Welcome message received');
        optionsRef.current.onWelcome?.();
      }
      logger.chat.info(`NOTICE: ${messageText}`);
    },

    usernotice: (channelName, tagsRecord, messageText) => {
      logger.chat.debug(
        `USERNOTICE in ${channelName}: ${tagsRecord['msg-id'] || 'unknown event'}`,
      );
      // SAFETY: routeIrcMessage only dispatches usernotice for a tagged USERNOTICE line, so tagsRecord carries the msg-id UserNoticeTags discriminates on.
      optionsRef.current.onUserNotice?.(
        channelName,
        tagsRecord as UserNoticeTags,
        messageText,
      );
    },

    clearchat: (channelName, tagsRecord, username, banDuration) => {
      logger.chat.info(
        `CLEARCHAT in ${channelName}: ${username || 'all messages cleared'}`,
      );
      optionsRef.current.onClearChat?.(
        channelName,
        tagsRecord,
        username,
        banDuration,
      );
    },

    clearmsg: (channelName, tagsRecord, targetMsgId) => {
      logger.chat.info(
        `CLEARMESSAGE in ${channelName}: message ${targetMsgId} deleted`,
      );
      optionsRef.current.onClearMessage?.(channelName, tagsRecord, targetMsgId);
    },

    roomstate: (channelName, tagsRecord) => {
      markChannelJoined(channelName);
      logger.chat.debug(`ROOMSTATE in ${channelName}`);
      optionsRef.current.onRoomState?.(channelName, tagsRecord);
    },

    userstate: (channelName, tagsRecord) => {
      markChannelJoined(channelName);
      logger.chat.debug(`USERSTATE in ${channelName}`);
      setCurrentUserStateIfOwner(userStateTokenRef.current, tagsRecord);

      if (pendingMessageRef.current && tagsRecord['msg-id']) {
        logger.chat.debug(
          `Received USERSTATE after sending message: ${tagsRecord['msg-id']}`,
        );
        optionsRef.current.onUserStateAfterSend?.(tagsRecord);
        pendingMessageRef.current = null;
      }

      optionsRef.current.onUserState?.(channelName, tagsRecord);
    },

    globaluserstate: tagsRecord => {
      logger.chat.debug('GLOBALUSERSTATE received');
      setCurrentUserStateIfOwner(userStateTokenRef.current, tagsRecord);
      optionsRef.current.onGlobalUserState?.(tagsRecord);
    },

    join: (channelName, nick) => {
      if (isSelfNick(nick)) {
        markChannelJoined(channelName);
        logger.chat.info(`✅ Joined channel: ${channelName}`);
        optionsRef.current.onJoin?.(channelName);
      } else if (nick) {
        optionsRef.current.onUserJoin?.(channelName, nick);
      }
    },

    part: (channelName, nick) => {
      if (isSelfNick(nick)) {
        logger.chat.info(`Left channel: ${channelName}`);
        pendingJoinChannelsRef.current.delete(channelName);
        joinedChannelsRef.current.delete(channelName);
        optionsRef.current.onPart?.(channelName);
      } else if (nick) {
        optionsRef.current.onUserPart?.(channelName, nick);
      }
    },

    namesReply: roomName => {
      markChannelJoined(roomName);
    },

    unhandled: (command, params) => {
      logger.chat.debug(
        `Unhandled IRC command: ${command} ${params.join(' ')}`,
      );
    },
  };

  const handleIrcMessage = (message: IrcMessage) => {
    routeIrcMessage(message, ircRouteHandlers);
  };

  const handleMessage = (event: MessageEvent<string>) => {
    try {
      lastActivityAtRef.current = Date.now();
      // Any inbound line proves the socket is alive, so a pending probe is
      // satisfied (Twitch's PONG arrives as a normal inbound line).
      awaitingPongRef.current = false;
      const text = `${messageBufferRef.current}${event.data}`;
      let cursor = 0;

      while (cursor < text.length) {
        const lineEnd = text.indexOf('\r\n', cursor);
        if (lineEnd === -1) {
          break;
        }

        const line = text.slice(cursor, lineEnd);
        cursor = lineEnd + 2;

        if (!line) {
          continue;
        }

        if (line === 'PING :tmi.twitch.tv') {
          sendIrcCommand('PONG', 'tmi.twitch.tv');
          continue;
        }

        // Flood backstop before the tag parse; only PRIVMSG consumes tokens, control lines always pass.
        if (isPrivmsgLine(line) && !shouldProcessLiveMessage()) {
          recordChatDebugIrcLine(line, true);
          continue;
        }

        recordChatDebugIrcLine(line);
        chatPerfMarks.lineReceived();
        const ircMessage = parseIrcMessage(line);
        if (ircMessage) {
          handleIrcMessage(ircMessage);
        }
      }

      messageBufferRef.current = text.slice(cursor);
    } catch (e) {
      logger.chat.error('Failed to parse IRC message:', e);
    }
  };

  const handleWebSocketOpen = useCallback(() => {
    logger.chat.info('💬 Twitch IRC WebSocket connected');
    isAuthenticatedRef.current = false;
    joinedChannelsRef.current.clear();
    lastActivityAtRef.current = Date.now();
    awaitingPongRef.current = false;

    authenticate();
  }, [authenticate, joinedChannelsRef]);

  const handleWebSocketClose = useCallback(
    (event: CloseEvent) => {
      logger.chat.warn(
        `💬 Twitch IRC WebSocket closed: ${event.code} - ${event.reason}`,
      );
      isAuthenticatedRef.current = false;
      joinedChannelsRef.current.clear();
      pendingJoinChannelsRef.current.clear();
      // Drop queued sends — reconnect must not flush commands from a dead socket.
      pendingIrcMessagesRef.current = [];
      messageBufferRef.current = '';
    },
    [joinedChannelsRef, pendingJoinChannelsRef],
  );

  const handleWebSocketError = handleTwitchChatWebSocketError;

  const shouldReconnect = (event: CloseEvent) => {
    if (event.code === 1000) {
      return false;
    }
    return shouldConnect;
  };

  const {
    getWebSocket,
    sendMessage: sendWebSocketMessage,
    readyState,
    reconnect,
  } = useWebsocket(shouldConnect ? TWITCH_CHAT_URL : null, {
    onOpen: handleWebSocketOpen,
    onMessage: handleMessage,
    onClose: handleWebSocketClose,
    onError: handleWebSocketError,
    shouldReconnect,
    /**
     * A long outage exhausted 30 attempts in ~7min and left chat dead until
     * remount; backoff caps at ~16s, so a higher ceiling just retries longer.
     */
    reconnectAttempts: 100,
    reconnectInterval: 2000,
  });

  // Reconnect chat when token changes (e.g. after 401 refresh) so we authenticate with the new token.
  const getWebSocketRef = useSyncRef(getWebSocket);
  const reconnectRef = useSyncRef(reconnect);
  const shouldConnectRef = useSyncRef(shouldConnect);

  // On foreground/network regain: PING an OPEN socket and reconnect if unanswered by the deadline; revive a non-OPEN socket directly.
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
      // AppState and network-regain often fire together on resume - don't stack a second probe.
      return;
    }

    awaitingPongRef.current = true;
    const sentAt = Date.now();
    probeSentAtRef.current = sentAt;
    sendIrcCommand('PING', 'tmi.twitch.tv');
    if (probeTimeoutRef.current) {
      clearTimeout(probeTimeoutRef.current);
    }
    probeTimeoutRef.current = setTimeout(() => {
      probeTimeoutRef.current = null;
      if (!shouldConnectRef.current || !awaitingPongRef.current) {
        return;
      }
      if (probeSentAtRef.current !== sentAt) {
        // A newer probe superseded this one; its own deadline governs.
        return;
      }
      const currentSocket = getWebSocketRef.current();
      if (currentSocket.readyState !== WebSocket.OPEN) {
        return;
      }
      logger.chat.warn(
        '💬 Twitch IRC liveness probe unanswered after resume, forcing reconnect',
        { name: 'twitch_chat_warning' },
      );
      awaitingPongRef.current = false;
      lastActivityAtRef.current = Date.now();
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
        isOpen: readyState === ReadyState.OPEN,
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
        // Probe unanswered past its deadline - half-open socket.
        const idleMs = Date.now() - lastActivityAtRef.current;
        logger.chat.warn(
          '💬 Twitch IRC PING unanswered past heartbeat, forcing reconnect',
          { name: 'twitch_chat_warning', idleMs },
        );
        // Bump the marker so we don't re-close before the reconnect lands.
        awaitingPongRef.current = false;
        lastActivityAtRef.current = Date.now();
        getWebSocketRef.current().close(4002, 'chat heartbeat timeout');
        return;
      }

      awaitingPongRef.current = true;
      probeSentAtRef.current = Date.now();
      sendIrcCommand('PING', 'tmi.twitch.tv');
    }, CHAT_HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [getWebSocketRef, readyState, sendIrcCommand, shouldConnect]);

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
      .catch(() => {
        // Ignore
      });
    const networkSubscription = Network.addNetworkStateListener(state => {
      const isConnected = Boolean(state.isConnected);
      // Only act on the regain edge; a steady connection needn't re-probe.
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
  }, [authState?.token?.accessToken, getWebSocketRef, shouldConnect]);

  // Membership is negotiated once per connection, so bounce the socket when the preference flips to renegotiate CAP REQ.
  const previousShowJoinPartRef = useRef(showJoinPartMessages);
  useEffect(() => {
    const previous = previousShowJoinPartRef.current;
    previousShowJoinPartRef.current = showJoinPartMessages;
    if (previous === showJoinPartMessages || !shouldConnect) {
      return;
    }
    if (getWebSocketRef.current().readyState !== WebSocket.OPEN) {
      return;
    }
    logger.chat.info(
      '[useTwitchChat] Join/part preference changed, reconnecting IRC to renegotiate membership capability',
    );
    getWebSocketRef.current().close(4005, 'membership capability change');
  }, [getWebSocketRef, shouldConnect, showJoinPartMessages]);

  useEffect(() => {
    sendIrcMessageRef.current = sendWebSocketMessage;
    const pendingMessages = pendingIrcMessagesRef.current.splice(0);
    pendingMessages.forEach(message => sendWebSocketMessage(message));

    return () => {
      if (sendIrcMessageRef.current === sendWebSocketMessage) {
        sendIrcMessageRef.current = null;
      }
    };
  }, [sendWebSocketMessage]);

  const joinChannelRef = useSyncRef(joinChannel);
  const partChannelRef = useSyncRef(partChannel);

  useEffect(() => {
    if (!shouldConnect || !isAuthenticatedRef.current) {
      return;
    }

    const previousChannel = Array.from(joinedChannelsRef.current)[0];

    if (channel) {
      const channelFormatted = channel.startsWith('#')
        ? channel
        : `#${channel}`;

      if (previousChannel && previousChannel !== channelFormatted) {
        partChannelRef.current(previousChannel);
      }

      if (!joinedChannelsRef.current.has(channelFormatted)) {
        joinChannelRef.current(channel);
      }
    } else if (previousChannel) {
      partChannelRef.current(previousChannel);
    }
  }, [
    channel,
    joinChannelRef,
    joinedChannelsRef,
    partChannelRef,
    shouldConnect,
  ]);

  useEffect(() => {
    const joinedChannels = joinedChannelsRef.current;
    const pendingJoinChannels = pendingJoinChannelsRef.current;
    const lastSentMessages = lastSentMessagesRef.current;
    const messageBuffer = messageBufferRef;
    const userStateToken = userStateTokenRef.current;
    currentUserStateOwner = userStateToken;

    return () => {
      logger.chat.info('[useTwitchChat] Cleaning up Twitch IRC client');
      joinedChannels.clear();
      pendingJoinChannels.clear();
      lastSentMessages.clear();
      messageBuffer.current = '';
      isAuthenticatedRef.current = false;
      if (currentUserStateOwner === userStateToken) {
        currentUserStateOwner = null;
        setCurrentUserState({});
      }
      pendingMessageRef.current = null;
    };
  }, [
    joinedChannelsRef,
    lastSentMessagesRef,
    pendingJoinChannelsRef,
    userStateTokenRef,
  ]);

  const sendMessage = (
    channelName: string,
    message: string,
    replyParentMsgId?: string,
    replyParentDisplayName?: string,
    replyParentMsgBody?: string,
  ) => {
    if (message.trim().length === 0) {
      logger.chat.warn('Cannot send empty message');
      return;
    }

    const channelFormatted = formatIrcChannelName(channelName);

    const outgoing = applyAntiDuplicateSuffix(
      message,
      lastSentMessagesRef.current.get(channelFormatted),
    );
    lastSentMessagesRef.current.set(channelFormatted, outgoing);

    pendingMessageRef.current = {
      channel: channelFormatted,
      message: outgoing,
      replyParentMsgId,
      replyParentDisplayName,
      replyParentMsgBody,
    };

    const fullMessage = buildPrivmsgLine({
      channel: channelFormatted,
      message: outgoing,
      replyParentMsgId,
    });
    logger.chat.debug(`Sending PRIVMSG: ${fullMessage.substring(0, 100)}...`);
    sendWebSocketMessage(`${fullMessage}\r\n`);
  };

  const sendChatCommand = (channelName: string, command: string) => {
    const trimmedCommand = command.trim();
    if (trimmedCommand.length === 0) {
      logger.chat.warn('Cannot send empty chat command');
      return;
    }

    const channelFormatted = formatIrcChannelName(channelName);
    const fullMessage = `PRIVMSG ${channelFormatted} :${trimmedCommand}`;
    logger.chat.debug(
      `Sending chat command: ${fullMessage.substring(0, 100)}...`,
    );
    sendWebSocketMessage(`${fullMessage}\r\n`);
  };

  /**
   * Send an action message (/me)
   */
  const sendAction = (channelName: string, action: string) => {
    const channelFormatted = formatIrcChannelName(channelName);

    // ACTION format: PRIVMSG #channel :\x01ACTION <message>\x01
    const actionMessage = `\x01ACTION ${action}\x01`;
    sendMessage(channelFormatted, actionMessage);
  };

  const isConnected = (): boolean => {
    const ws = getWebSocket();
    if (ws.readyState !== WebSocket.OPEN || !isAuthenticatedRef.current) {
      return false;
    }

    if (!channel) {
      return true;
    }

    return joinedChannelsRef.current.has(formatIrcChannelName(channel));
  };

  const connectionState = readyState;

  return {
    connectionState,
    getWebSocket,
    isConnected,
    joinChannel,
    partChannel,
    sendMessage,
    sendChatCommand,
    sendAction,
  };
}
