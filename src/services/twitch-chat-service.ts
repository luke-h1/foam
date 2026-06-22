import { useCallback, useEffect, useRef } from 'react';

import { useAuthContext } from '@app/context/AuthContext';
import { useLazyRef } from '@app/hooks/useLazyRef';
import { isE2EMode } from '@app/services/api/clients';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import {
  containsMutedWords,
  isUserBlocked,
} from '@app/utils/chat/chatMessageFilters';
import { type IrcMessage, parseIrcMessage } from '@app/utils/chat/ircProtocol';
import { logger } from '@app/utils/logger';

import { ReadyState } from '../hooks/ws/constants';
import { useWebsocket } from '../hooks/ws/useWebsocket';

/**
 * Twitch IRC PINGs roughly every 5 min and we PONG, but a half-open socket
 * (Wi-Fi↔cellular handoff, NAT/idle timeout, background→foreground) frequently
 * fires no close event: the WebSocket sits in OPEN forever, no messages arrive,
 * and the reconnect path never runs — chat silently stops while the app still
 * believes it is connected. Send our own PING on an interval (Twitch answers
 * with PONG, which counts as inbound activity) and force a reconnect if the
 * server has gone quiet for longer than the timeout.
 */
const CHAT_HEARTBEAT_INTERVAL_MS = 60_000;
const CHAT_HEARTBEAT_TIMEOUT_MS = 150_000;

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
  // Filtering options
  blockedUsers?: { userLogin: string }[];
  mutedWords?: string[];
  matchWholeWord?: boolean;
  // User state callback - called when user state is received after sending a message
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

  /**
   * Send IRC command
   */
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

  // Join a channel
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

  /**
   * Authenticate with Twitch IRC
   */
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

  /**
   * Part from a channel
   */
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
    const { command, tags, params } = message;
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
          const username = tagsRecord['display-name'] || tagsRecord.login;

          if (channelName && messageText) {
            // Filter blocked users (unless moderator or channel owner)
            const isMod = tagsRecord.mod === '1';
            const isChannelOwner =
              channelName.slice(1).toLowerCase() === user?.login?.toLowerCase();

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

            // Filter muted words
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
        break;
      }

      case 'NOTICE': {
        // Server notices (e.g., connection messages, errors)
        if (params.length >= 2 && tags) {
          const channelName = params[0];
          const messageText = params[1];

          // Check for welcome message
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

  useEffect(() => {
    if (!shouldConnect) {
      return;
    }

    const interval = setInterval(() => {
      if (readyState !== ReadyState.OPEN) {
        return;
      }
      const idleMs = Date.now() - lastActivityAtRef.current;
      if (idleMs >= CHAT_HEARTBEAT_TIMEOUT_MS) {
        logger.chat.warn(
          '💬 Twitch IRC idle past heartbeat timeout, forcing reconnect',
          { name: 'twitch_chat_warning', idleMs },
        );
        // Bump the marker so we don't re-close before the reconnect lands.
        lastActivityAtRef.current = Date.now();
        getWebSocketRef.current().close(4002, 'chat heartbeat timeout');
        return;
      }
      sendIrcCommand('PING', 'tmi.twitch.tv');
    }, CHAT_HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [shouldConnect, readyState, sendIrcCommand]);

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

  // Join/part channel when it changes
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

  /**
   * Send a chat message
   */
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

    // Build PRIVMSG command with optional reply tags
    // Twitch IRC format: @reply-parent-msg-id=<id>;reply-parent-display-name=<name>;reply-parent-msg-body=<body> PRIVMSG #channel :message
    let privmsgCommand = 'PRIVMSG';
    if (replyParentMsgId) {
      const tags: string[] = [`reply-parent-msg-id=${replyParentMsgId}`];

      if (replyParentDisplayName) {
        tags.push(`reply-parent-display-name=${replyParentDisplayName}`);
      }

      if (replyParentMsgBody) {
        tags.push(`reply-parent-msg-body=${replyParentMsgBody}`);
      }

      privmsgCommand = `@${tags.join(';')} ${privmsgCommand}`;
    }

    const fullMessage = `${privmsgCommand} ${channelFormatted} :${message}`;
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

  /**
   * Get current user state
   */
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
