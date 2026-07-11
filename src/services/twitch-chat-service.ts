import { useCallback, useEffect, useRef } from 'react';

import * as Network from 'expo-network';

import { useAuthContext } from '@app/context/AuthContext';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { isE2EMode } from '@app/services/api/clients';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { subscribeToAppStateTransitions } from '@app/utils/appState/appStateTransitions';
import { getHeartbeatAction } from '@app/utils/chat/chatHeartbeat';
import { shouldProcessLiveMessage } from '@app/utils/chat/chatIngestRateLimiter';
import { containsMutedWords } from '@app/utils/chat/chatMessageFilters/containsMutedWords';
import { isUserBlocked } from '@app/utils/chat/chatMessageFilters/isUserBlocked';
import {
  buildPrivmsgLine,
  type IrcMessage,
  isPrivmsgLine,
  parseIrcMessage,
} from '@app/utils/chat/ircProtocol';
import { logger } from '@app/utils/logger';

import { ReadyState } from '../hooks/ws/constants';
import { useWebsocket } from '../hooks/ws/useWebsocket';

/**
 * Twitch IRC PINGs roughly every 5 min and we PONG, but a half-open socket
 * (Wi-Fi↔cellular handoff, NAT/idle timeout, background→foreground) frequently
 * fires no close event: the WebSocket sits in OPEN forever, no messages arrive,
 * and the reconnect path never runs - chat silently stops while the app still
 * believes it is connected. Once the socket has been quiet for an interval we
 * send our own PING and mark that we are awaiting a PONG; if the next tick still
 * hasn't seen any inbound line (PONG or otherwise) the socket is dead and we
 * force a reconnect. A busy channel proves liveness through its own traffic, so
 * it never needs to probe. React Native's WebSocket exposes no ping frames, so
 * this application-level PING/PONG is the only half-open detector available.
 */
const CHAT_HEARTBEAT_INTERVAL_MS = 30_000;
/**
 * After returning to the foreground or regaining connectivity, probe the socket
 * and reconnect if Twitch does not answer within this window - far faster than
 * waiting for the next heartbeat tick to notice a suspended socket is dead.
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
  const optionsRef = useRef<UseTwitchChatOptions>({});
  optionsRef.current = options;
  const { authState, user } = useAuthContext();
  const channel = optionsRef.current.channel;
  const blockedUsers = optionsRef.current.blockedUsers ?? [];
  const mutedWords = optionsRef.current.mutedWords ?? [];
  const matchWholeWord = optionsRef.current.matchWholeWord ?? false;

  const isAuthenticatedRef = useRef(false);
  const joinedChannelsRef = useLazyRef(() => new Set<string>());
  const pendingJoinChannelsRef = useLazyRef(() => new Set<string>());
  const anonymousNickRef = useRef(
    `justinfan${Math.floor(Math.random() * 90000) + 10000}`,
  );
  const pendingIrcMessagesRef = useRef<string[]>([]);
  // Seeded on open and refreshed on every inbound line; the heartbeat only
  // reads it once readyState is OPEN, by which point onOpen has set it.
  const lastActivityAtRef = useRef(0);
  // True while a heartbeat/foreground PING is outstanding. Any inbound line
  // clears it (a live socket answers, or is already busy); if it survives past
  // its deadline the socket is half-open and we reconnect.
  const awaitingPongRef = useRef(false);
  // When the outstanding probe's PING was sent. The heartbeat and the
  // foreground liveness check share awaitingPongRef, so each needs to know how
  // old the pending probe actually is before declaring the socket dead - a
  // flushed heartbeat tick right after resume must not tear down a socket whose
  // probe is milliseconds old.
  const probeSentAtRef = useRef(0);
  const probeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendIrcMessageRef = useRef<((message: string) => void) | null>(null);
  const messageBufferRef = useRef<string>('');
  const userStateRef = useRef<Record<string, string>>({});
  const pendingMessageRef = useRef<{
    channel: string;
    message: string;
    replyParentMsgId?: string;
    replyParentDisplayName?: string;
    replyParentMsgBody?: string;
  } | null>(null);

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

    sendIrcCommand('CAP REQ :twitch.tv/tags twitch.tv/commands');
    sendIrcCommand('PASS', passToken);
    sendIrcCommand('NICK', nickname);

    if (channel) {
      setTimeout(() => {
        if (isAuthenticatedRef.current) {
          joinChannel(channel);
        }
      }, 250);
    }
  }, [authState, user, sendIrcCommand, channel, joinChannel]);

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

  const handleIrcMessage = (message: IrcMessage) => {
    const { command, tags, params, prefix } = message;
    const tagsRecord = tags ?? {};

    switch (command) {
      case '001': // RPL_WELCOME - server welcome message
      case '002': // RPL_YOURHOST
      case '003': // RPL_CREATED
      case '004': // RPL_MYINFO
      case '375': // RPL_MOTDSTART
      case '372': // RPL_MOTD
      case '376': // RPL_ENDOFMOTD
        logger.chat.debug(`IRC ${command}: ${params.join(' ')}`);
        if (command === '001') {
          isAuthenticatedRef.current = true;
          logger.chat.info('✅ Authenticated with Twitch IRC');

          if (channel) {
            joinChannel(channel);
          }
        }
        break;

      case 'PING': {
        const server = params[0] || 'tmi.twitch.tv';
        logger.chat.debug(`Received PING, sending PONG to ${server}`);
        sendIrcCommand('PONG', server);
        break;
      }

      case 'PRIVMSG': {
        // Chat message received
        if (params.length >= 2 && tags) {
          const channelName = params[0];
          const messageText = params[1];
          // PRIVMSG tags carry no `login`; the canonical Twitch login is the
          // nick in the IRC prefix (`nick!user@host`). Localised display names
          // are not the login, so derive it from the prefix instead.
          if (!tagsRecord.login && prefix) {
            tagsRecord.login = prefix.split('!')[0] ?? '';
          }
          const username = tagsRecord['display-name'] || tagsRecord.login;

          if (channelName && messageText) {
            // The mod/owner exemption strings are only needed when a blocklist
            // exists - skip the per-message lowercasing otherwise.
            if (blockedUsers.length > 0) {
              const isMod = tagsRecord.mod === '1';
              const isChannelOwner =
                channelName.slice(1).toLowerCase() ===
                user?.login?.toLowerCase();

              if (
                !isMod &&
                !isChannelOwner &&
                isUserBlocked(username, blockedUsers)
              ) {
                logger.chat.debug(
                  `Filtered message from blocked user: ${username}`,
                );
                return;
              }
            }

            if (containsMutedWords(messageText, mutedWords, matchWholeWord)) {
              logger.chat.debug(`Filtered message containing muted words`);
              return;
            }

            // logger.chat.debug(
            //   `PRIVMSG in ${channelName}: ${messageText.substring(0, 50)}...`,
            // );
            optionsRef.current.onMessage?.(
              channelName,
              tagsRecord,
              messageText,
            );
          }
        }
        break;
      }

      case 'RECONNECT': {
        logger.chat.warn('Received Twitch IRC RECONNECT request');
        optionsRef.current.onReconnect?.();
        lastActivityAtRef.current = Date.now();
        getWebSocketRef.current().close(4003, 'twitch reconnect');
        break;
      }

      case 'NOTICE': {
        // Server notices (e.g., connection messages, errors)
        if (params.length >= 2 && tags) {
          const channelName = params[0];
          const messageText = params[1];

          if (messageText && messageText.includes('Welcome, GLHF!')) {
            logger.chat.info('✅ Welcome message received');
            optionsRef.current.onWelcome?.();
          }

          if (channelName && messageText) {
            logger.chat.info(`NOTICE in ${channelName}: ${messageText}`);
            optionsRef.current.onNotice?.(channelName, tagsRecord, messageText);
          }
        } else if (params.length > 0) {
          // Some notices don't have channel name
          const messageText = params.join(' ');
          if (messageText.includes('Welcome, GLHF!')) {
            logger.chat.info('✅ Welcome message received');
            optionsRef.current.onWelcome?.();
          }
          logger.chat.info(`NOTICE: ${messageText}`);
        }
        break;
      }

      case 'USERNOTICE': {
        if (params.length >= 1 && tags) {
          const channelName = params[0];
          const messageText = params[1] ?? '';

          if (channelName) {
            logger.chat.debug(
              `USERNOTICE in ${channelName}: ${tagsRecord['msg-id'] || 'unknown event'}`,
            );
            optionsRef.current.onUserNotice?.(
              channelName,
              tagsRecord as UserNoticeTags,
              messageText,
            );
          }
        }
        break;
      }

      case 'CLEARCHAT': {
        // User timeout/ban
        if (params.length >= 1 && tags) {
          const channelName = params[0];
          const username = params[1]; // May be empty for full chat clear
          const banDuration = tagsRecord['ban-duration']
            ? parseInt(tagsRecord['ban-duration'], 10)
            : undefined;

          if (channelName) {
            logger.chat.info(
              `CLEARCHAT in ${channelName}: ${username || 'all messages cleared'}`,
            );
            optionsRef.current.onClearChat?.(
              channelName,
              tagsRecord,
              username,
              banDuration,
            );
          }
        }
        break;
      }

      case 'CLEARMSG':
      case 'CLEARMESSAGE': {
        if (params.length >= 2 && tags) {
          const channelName = params[0];
          const targetMsgId = tagsRecord['target-msg-id'];

          if (channelName && targetMsgId) {
            logger.chat.info(
              `CLEARMESSAGE in ${channelName}: message ${targetMsgId} deleted`,
            );
            optionsRef.current.onClearMessage?.(
              channelName,
              tagsRecord,
              targetMsgId,
            );
          }
        }
        break;
      }

      case 'ROOMSTATE': {
        // Room state changes (slow mode, followers-only, etc.)
        if (params.length >= 1 && tags) {
          const channelName = params[0];

          if (channelName) {
            markChannelJoined(channelName);
            logger.chat.debug(`ROOMSTATE in ${channelName}`);
            optionsRef.current.onRoomState?.(channelName, tagsRecord);
          }
        }
        break;
      }

      case 'USERSTATE': {
        // User's state in the channel (sent after JOIN or after sending a message)
        if (params.length >= 1 && tags) {
          const channelName = params[0];

          if (channelName) {
            markChannelJoined(channelName);
            logger.chat.debug(`USERSTATE in ${channelName}`);
            userStateRef.current = tagsRecord;

            // If we have a pending message, this USERSTATE might be for it
            if (pendingMessageRef.current && tagsRecord['msg-id']) {
              logger.chat.debug(
                `Received USERSTATE after sending message: ${tagsRecord['msg-id']}`,
              );
              optionsRef.current.onUserStateAfterSend?.(tagsRecord);
              pendingMessageRef.current = null;
            }

            optionsRef.current.onUserState?.(channelName, tagsRecord);
          }
        }
        break;
      }

      case 'GLOBALUSERSTATE': {
        // Global user state (includes emote sets)
        logger.chat.debug('GLOBALUSERSTATE received');
        userStateRef.current = tagsRecord;
        optionsRef.current.onGlobalUserState?.(tagsRecord);
        break;
      }

      case 'JOIN': {
        if (params.length > 0) {
          const channelName = params[0];
          if (channelName) {
            markChannelJoined(channelName);
            logger.chat.info(`✅ Joined channel: ${channelName}`);
            optionsRef.current.onJoin?.(channelName);
          }
        }
        break;
      }

      case 'PART': {
        if (params.length > 0) {
          const channelName = params[0];
          if (channelName) {
            logger.chat.info(`Left channel: ${channelName}`);
            pendingJoinChannelsRef.current.delete(channelName);
            joinedChannelsRef.current.delete(channelName);
            optionsRef.current.onPart?.(channelName);
          }
        }
        break;
      }

      case '353': // RPL_NAMREPLY - user list
      case '366': {
        // RPL_ENDOFNAMES - end of user list
        const roomName = params.find(param => param.startsWith('#'));
        if (roomName) {
          markChannelJoined(roomName);
        }
        break;
      }

      default:
        logger.chat.debug(
          `Unhandled IRC command: ${command} ${params.join(' ')}`,
        );
    }
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      lastActivityAtRef.current = Date.now();
      // Any inbound line proves the socket is alive, so a pending probe is
      // satisfied (Twitch's PONG arrives as a normal inbound line).
      awaitingPongRef.current = false;
      const text = `${messageBufferRef.current}${event.data as string}`;
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

        // Flood backstop, consulted before the full tag parse so dropped
        // messages cost almost nothing. Only PRIVMSG lines consume tokens;
        // control lines (CLEARCHAT, ROOMSTATE, USERNOTICE…) always pass.
        // Replay is unaffected - it flows through the recent-messages path,
        // never this socket.
        if (isPrivmsgLine(line) && !shouldProcessLiveMessage()) {
          continue;
        }

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
      messageBufferRef.current = '';
    },
    [joinedChannelsRef],
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
  } = useWebsocket(
    shouldConnect ? TWITCH_CHAT_URL : null,
    {
      onOpen: handleWebSocketOpen,
      onMessage: handleMessage,
      onClose: handleWebSocketClose,
      onError: handleWebSocketError,
      shouldReconnect,
      /**
       * A long outage (tunnel/commute) used to exhaust 30 attempts in ~7min and
       * then never retry, leaving chat permanently dead until the screen
       * remounted. The backoff caps the interval at ~16s, so a higher ceiling
       * just keeps chat trying to come back across a longer gap.
       */
      reconnectAttempts: 100,
      reconnectInterval: 2000,
    },
    shouldConnect,
  );

  // Reconnect chat when token changes (e.g. after 401 refresh) so we authenticate with the new token.
  const getWebSocketRef = useRef(getWebSocket);
  getWebSocketRef.current = getWebSocket;
  const reconnectRef = useRef(reconnect);
  reconnectRef.current = reconnect;
  const shouldConnectRef = useRef(shouldConnect);
  shouldConnectRef.current = shouldConnect;

  // Probe an OPEN-but-possibly-half-open socket after the app returns to the
  // foreground or regains connectivity: send a PING and, if Twitch has not
  // answered within a short deadline, force a reconnect. If the socket isn't
  // OPEN (its automatic retries may have been exhausted during a long
  // background/outage), revive it directly.
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
      // A probe is already in flight with its own deadline (AppState and the
      // network-regain listener often fire together on resume) - don't stack a
      // second PING and a second close timer on top of it.
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
  const verifyChatLivenessRef = useRef(verifyChatLiveness);
  verifyChatLivenessRef.current = verifyChatLiveness;

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
        // The outstanding probe went unanswered past its deadline - the
        // socket is half-open.
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
  }, [shouldConnect, readyState, sendIrcCommand]);

  // Chat has no proactive recovery on its own: a suspended or network-flapped
  // socket often stays OPEN with no close event, so without this it would take
  // a full heartbeat cycle to notice. Re-verify liveness the moment the app
  // returns to the foreground or connectivity is regained.
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
  }, [shouldConnect]);

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

  const joinChannelRef = useRef(joinChannel);
  joinChannelRef.current = joinChannel;
  const partChannelRef = useRef(partChannel);
  partChannelRef.current = partChannel;

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
  }, [channel, joinedChannelsRef, shouldConnect]);

  useEffect(() => {
    const joinedChannels = joinedChannelsRef.current;
    const pendingJoinChannels = pendingJoinChannelsRef.current;
    const messageBuffer = messageBufferRef;

    return () => {
      logger.chat.info('[useTwitchChat] Cleaning up Twitch IRC client');
      joinedChannels.clear();
      pendingJoinChannels.clear();
      messageBuffer.current = '';
      isAuthenticatedRef.current = false;
      userStateRef.current = {};
      pendingMessageRef.current = null;
    };
  }, [joinedChannelsRef, pendingJoinChannelsRef]);

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

    pendingMessageRef.current = {
      channel: channelFormatted,
      message,
      replyParentMsgId,
      replyParentDisplayName,
      replyParentMsgBody,
    };

    const fullMessage = buildPrivmsgLine({
      channel: channelFormatted,
      message,
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

  const getUserState = useCallback((): Record<string, string> => {
    return { ...userStateRef.current };
  }, []);

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
    getUserState,
  };
}
