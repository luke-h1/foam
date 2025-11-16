import { useAuthContext } from '@app/context/AuthContext';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { logger } from '@app/utils/logger';
import { useNavigationState } from '@react-navigation/native';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { CHAT_SCREENS } from '../constants/chat';
import { useWebsocket } from '../hooks/ws/useWebsocket';
import { getActiveRouteName } from '../navigators/navigationUtilities';

const TWITCH_CHAT_URL = 'wss://irc-ws.chat.twitch.tv:443';

interface IrcMessage {
  tags?: Map<string, string>;
  prefix?: string;
  command: string;
  params: string[];
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
  blockedUsers?: Array<{ userLogin: string }>;
  mutedWords?: string[];
  matchWholeWord?: boolean;
  // User state callback - called when user state is received after sending a message
  onUserStateAfterSend?: (tags: Record<string, string>) => void;
}

export function useTwitchChat(options: UseTwitchChatOptions = {}) {
  const { authState, user } = useAuthContext();
  const {
    channel,
    onMessage,
    onJoin,
    onPart,
    onNotice,
    onUserNotice,
    onClearChat,
    onClearMessage,
    onRoomState,
    onUserState,
    onGlobalUserState,
    onWelcome,
    blockedUsers = [],
    mutedWords = [],
    matchWholeWord = false,
    onUserStateAfterSend,
  } = options;

  const hasInitialized = useRef(false);
  const lastScreenRef = useRef<string | null>(null);
  const isAuthenticatedRef = useRef(false);
  const joinedChannelsRef = useRef<Set<string>>(new Set());
  const getWebSocketRef = useRef<(() => WebSocket) | null>(null);
  const messageBufferRef = useRef<string>('');
  const userStateRef = useRef<Record<string, string>>({});
  const pendingMessageRef = useRef<{
    channel: string;
    message: string;
    replyParentMsgId?: string;
    replyParentDisplayName?: string;
    replyParentMsgBody?: string;
  } | null>(null);

  const currentScreen = useNavigationState(state => {
    if (!state) return null;
    return getActiveRouteName(state);
  });

  // Determine if we should be connected based on screen
  const shouldConnect = useMemo(() => {
    if (!currentScreen) return false;
    return CHAT_SCREENS.includes(currentScreen as 'Chat' | 'LiveStream');
  }, [currentScreen]);

  /**
   * Parse IRC message tags (format: @key=value;key2=value2)
   */
  const parseTags = useCallback((tagString: string): Map<string, string> => {
    const tags = new Map<string, string>();
    if (!tagString) return tags;

    const parts = tagString.split(';');
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key) {
        tags.set(key, value || '');
      }
    });
    return tags;
  }, []);

  /**
   * Parse IRC message (format: [@tags] :prefix COMMAND params)
   */
  const parseIrcMessage = useCallback(
    (line: string): IrcMessage | null => {
      if (!line.trim()) {
        return null;
      }

      let remaining = line.trim();
      let tags: Map<string, string> | undefined;
      let prefix: string | undefined;

      // Parse tags
      if (remaining.startsWith('@')) {
        const tagEnd = remaining.indexOf(' ');
        if (tagEnd === -1) return null;
        const tagString = remaining.substring(1, tagEnd);
        tags = parseTags(tagString);
        remaining = remaining.substring(tagEnd + 1).trim();
      }

      // Parse prefix
      if (remaining.startsWith(':')) {
        const prefixEnd = remaining.indexOf(' ');
        if (prefixEnd === -1) return null;
        prefix = remaining.substring(1, prefixEnd);
        remaining = remaining.substring(prefixEnd + 1).trim();
      }

      // Parse command and params
      const parts = remaining.split(' ');
      if (parts.length === 0) return null;

      const command = parts[0];
      if (!command) return null;

      const params: string[] = [];
      const paramParts = parts.slice(1);

      // Find trailing parameter (starts with ':')
      const trailingIndex = paramParts.findIndex(part => part.startsWith(':'));

      if (trailingIndex >= 0) {
        // Add all params before the trailing one
        params.push(...paramParts.slice(0, trailingIndex));
        // Add trailing parameter (everything after ':' including spaces)
        const trailing = paramParts.slice(trailingIndex).join(' ').substring(1);
        params.push(trailing);
      } else {
        // No trailing parameter, add all params
        params.push(...paramParts);
      }

      return { tags, prefix, command, params };
    },
    [parseTags],
  );

  /**
   * Convert tags Map to Record for easier access
   */
  const tagsToRecord = useCallback(
    (tags?: Map<string, string>): Record<string, string> => {
      const record: Record<string, string> = {};
      if (tags) {
        tags.forEach((value, key) => {
          record[key] = value;
        });
      }
      return record;
    },
    [],
  );

  /**
   * Check if a user is blocked
   */
  const isUserBlocked = useCallback(
    (username?: string): boolean => {
      if (!username || blockedUsers.length === 0) return false;
      return blockedUsers.some(
        blockedUser =>
          blockedUser.userLogin.toLowerCase() === username.toLowerCase(),
      );
    },
    [blockedUsers],
  );

  /**
   * Check if message contains muted words
   */
  const containsMutedWords = useCallback(
    (message: string): boolean => {
      if (mutedWords.length === 0) return false;

      const messageLower = message.toLowerCase();
      const words = matchWholeWord ? messageLower.split(' ') : [messageLower];

      return mutedWords.some(mutedWord => {
        const mutedWordLower = mutedWord.toLowerCase();
        return words.some(word => word === mutedWordLower);
      });
    },
    [mutedWords, matchWholeWord],
  );

  /**
   * Send IRC command
   */
  const sendIrcCommand = useCallback((command: string, ...params: string[]) => {
    const ws = getWebSocketRef.current?.();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      logger.chat.warn('Cannot send IRC command - WebSocket not open');
      return;
    }

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
    ws.send(`${message}\r\n`);
  }, []);

  /**
   * Authenticate with Twitch IRC
   */
  const authenticate = useCallback(() => {
    if (!authState?.token?.accessToken || !user?.login) {
      logger.chat.warn('Cannot authenticate - missing token or username');
      return;
    }

    logger.chat.info('Authenticating with Twitch IRC...');

    /**
     * Request the tags and commands capabilities.
     * display tags containing metadata along with each IRC message.
     */
    sendIrcCommand('CAP REQ :twitch.tv/tags twitch.tv/commands');

    /**
     * Pass oAuth token - either anon or user token
     */
    sendIrcCommand('PASS', `oauth:${authState.token.accessToken}`);

    /**
     * The nickname to pass - either user nickname or the twitch default
     */
    sendIrcCommand('NICK', user.login ?? 'justinfan888');
  }, [authState, user, sendIrcCommand]);

  // Join a channel
  const joinChannel = useCallback(
    (channelName: string) => {
      if (!channelName) return;

      const channelFormatted = channelName.startsWith('#')
        ? channelName
        : `#${channelName}`;

      if (joinedChannelsRef.current.has(channelFormatted)) {
        logger.chat.debug(`Already joined channel: ${channelFormatted}`);
        return;
      }

      logger.chat.info(`Joining channel: ${channelFormatted}`);
      sendIrcCommand('JOIN', channelFormatted);
      joinedChannelsRef.current.add(channelFormatted);
    },
    [sendIrcCommand],
  );

  /**
   * Part from a channel
   */
  const partChannel = useCallback(
    (channelName: string) => {
      if (!channelName) return;

      const channelFormatted = channelName.startsWith('#')
        ? channelName
        : `#${channelName}`;

      if (!joinedChannelsRef.current.has(channelFormatted)) {
        return;
      }

      logger.chat.info(`Parting from channel: ${channelFormatted}`);
      sendIrcCommand('PART', channelFormatted);
      joinedChannelsRef.current.delete(channelFormatted);
      onPart?.(channelFormatted);
    },
    [sendIrcCommand, onPart],
  );

  const handleIrcMessage = useCallback(
    (message: IrcMessage) => {
      const { command, tags, params } = message;
      const tagsRecord = tagsToRecord(tags);

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
                channelName.slice(1).toLowerCase() ===
                user?.login?.toLowerCase();

              if (!isMod && !isChannelOwner && isUserBlocked(username)) {
                logger.chat.debug(
                  `Filtered message from blocked user: ${username}`,
                );
                return;
              }

              // Filter muted words
              if (containsMutedWords(messageText)) {
                logger.chat.debug(`Filtered message containing muted words`);
                return;
              }

              // logger.chat.debug(
              //   `PRIVMSG in ${channelName}: ${messageText.substring(0, 50)}...`,
              // );
              onMessage?.(channelName, tagsRecord, messageText);
            }
          }
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
              onWelcome?.();
            }

            if (channelName && messageText) {
              logger.chat.info(`NOTICE in ${channelName}: ${messageText}`);
              onNotice?.(channelName, tagsRecord, messageText);
            }
          } else if (params.length > 0) {
            // Some notices don't have channel name
            const messageText = params.join(' ');
            if (messageText.includes('Welcome, GLHF!')) {
              logger.chat.info('✅ Welcome message received');
              onWelcome?.();
            }
            logger.chat.info(`NOTICE: ${messageText}`);
          }
          break;
        }

        case 'USERNOTICE': {
          // User notices (subs, raids, hosts, etc.)
          if (params.length >= 2 && tags) {
            const channelName = params[0];
            const messageText = params[1];

            if (channelName) {
              logger.chat.debug(
                `USERNOTICE in ${channelName}: ${tagsRecord['msg-id'] || 'unknown event'}`,
              );
              onUserNotice?.(
                channelName,
                tagsRecord as UserNoticeTags,
                messageText || '',
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
              onClearChat?.(channelName, tagsRecord, username, banDuration);
            }
          }
          break;
        }

        case 'CLEARMESSAGE': {
          if (params.length >= 2 && tags) {
            const channelName = params[0];
            const targetMsgId = tagsRecord['target-msg-id'];

            if (channelName && targetMsgId) {
              logger.chat.info(
                `CLEARMESSAGE in ${channelName}: message ${targetMsgId} deleted`,
              );
              onClearMessage?.(channelName, tagsRecord, targetMsgId);
            }
          }
          break;
        }

        case 'ROOMSTATE': {
          // Room state changes (slow mode, followers-only, etc.)
          if (params.length >= 1 && tags) {
            const channelName = params[0];

            if (channelName) {
              logger.chat.debug(`ROOMSTATE in ${channelName}`);
              onRoomState?.(channelName, tagsRecord);
            }
          }
          break;
        }

        case 'USERSTATE': {
          // User's state in the channel (sent after JOIN or after sending a message)
          if (params.length >= 1 && tags) {
            const channelName = params[0];

            if (channelName) {
              logger.chat.debug(`USERSTATE in ${channelName}`);
              userStateRef.current = tagsRecord;

              // If we have a pending message, this USERSTATE might be for it
              if (pendingMessageRef.current && tagsRecord['msg-id']) {
                logger.chat.debug(
                  `Received USERSTATE after sending message: ${tagsRecord['msg-id']}`,
                );
                onUserStateAfterSend?.(tagsRecord);
                pendingMessageRef.current = null;
              }

              onUserState?.(channelName, tagsRecord);
            }
          }
          break;
        }

        case 'GLOBALUSERSTATE': {
          // Global user state (includes emote sets)
          logger.chat.debug('GLOBALUSERSTATE received');
          userStateRef.current = tagsRecord;
          onGlobalUserState?.(tagsRecord);
          break;
        }

        case 'JOIN': {
          if (params.length > 0) {
            const channelName = params[0];
            if (channelName) {
              logger.chat.info(`✅ Joined channel: ${channelName}`);
              onJoin?.(channelName);
            }
          }
          break;
        }

        case 'PART': {
          if (params.length > 0) {
            const channelName = params[0];
            if (channelName) {
              logger.chat.info(`Left channel: ${channelName}`);
              joinedChannelsRef.current.delete(channelName);
              onPart?.(channelName);
            }
          }
          break;
        }

        case '353': // RPL_NAMREPLY - user list
        case '366': // RPL_ENDOFNAMES - end of user list
          break;

        default:
          logger.chat.debug(
            `Unhandled IRC command: ${command} ${params.join(' ')}`,
          );
      }
    },
    [
      channel,
      joinChannel,
      sendIrcCommand,
      onMessage,
      onJoin,
      onPart,
      onNotice,
      onUserNotice,
      onClearChat,
      onClearMessage,
      onRoomState,
      onUserState,
      onGlobalUserState,
      onWelcome,
      onUserStateAfterSend,
      tagsToRecord,
      isUserBlocked,
      containsMutedWords,
      user?.login,
    ],
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        // IRC messages are text-based, can be multiple messages per event
        const text = event.data as string;
        messageBufferRef.current += text;

        // Split by \r\n but handle partial messages
        const lines = messageBufferRef.current.split('\r\n');

        // Keep the last incomplete line in buffer
        messageBufferRef.current = lines.pop() || '';

        // Process complete lines
        lines
          .filter(line => line.trim())
          .forEach(line => {
            // Handle raw PING messages (not parsed as IRC)
            if (line === 'PING :tmi.twitch.tv') {
              sendIrcCommand('PONG', 'tmi.twitch.tv');
              return;
            }

            const ircMessage = parseIrcMessage(line);
            if (ircMessage) {
              handleIrcMessage(ircMessage);
            }
          });
      } catch (e) {
        logger.chat.error('Failed to parse IRC message:', e);
      }
    },
    [parseIrcMessage, handleIrcMessage, sendIrcCommand],
  );

  const handleWebSocketOpen = useCallback(() => {
    logger.chat.info('💬 Twitch IRC WebSocket connected');
    isAuthenticatedRef.current = false;
    joinedChannelsRef.current.clear();

    authenticate();
  }, [authenticate]);

  const handleWebSocketClose = useCallback((event: CloseEvent) => {
    logger.chat.warn(
      `💬 Twitch IRC WebSocket closed: ${event.code} - ${event.reason}`,
    );
    isAuthenticatedRef.current = false;
    joinedChannelsRef.current.clear();
    messageBufferRef.current = '';
  }, []);

  const handleWebSocketError = useCallback((error: Event) => {
    logger.chat.error('💬 Twitch IRC WebSocket error:', error);
  }, []);

  const shouldReconnect = useCallback(
    (event: CloseEvent) => {
      // Don't reconnect on normal closure
      if (event.code === 1000) {
        return false;
      }
      return shouldConnect;
    },
    [shouldConnect],
  );

  const { getWebSocket } = useWebsocket(
    shouldConnect ? TWITCH_CHAT_URL : null,
    {
      onOpen: handleWebSocketOpen,
      onMessage: handleMessage,
      onClose: handleWebSocketClose,
      onError: handleWebSocketError,
      shouldReconnect,
      reconnectAttempts: 20,
      reconnectInterval: 2000,
    },
    shouldConnect,
  );

  useEffect(() => {
    getWebSocketRef.current = getWebSocket;
  }, [getWebSocket]);

  // Join/part channel when it changes
  useEffect(() => {
    if (!shouldConnect || !isAuthenticatedRef.current) return;

    const previousChannel = Array.from(joinedChannelsRef.current)[0];

    if (channel) {
      const channelFormatted = channel.startsWith('#')
        ? channel
        : `#${channel}`;

      if (previousChannel && previousChannel !== channelFormatted) {
        partChannel(previousChannel);
      }

      if (!joinedChannelsRef.current.has(channelFormatted)) {
        joinChannel(channel);
      }
    } else if (previousChannel) {
      partChannel(previousChannel);
    }
  }, [channel, shouldConnect, joinChannel, partChannel]);

  useEffect(() => {
    if (!currentScreen) return;

    const isOnChatScreen = CHAT_SCREENS.includes(
      currentScreen as 'Chat' | 'LiveStream',
    );
    const wasOnChatScreen = lastScreenRef.current
      ? CHAT_SCREENS.includes(lastScreenRef.current as 'Chat' | 'LiveStream')
      : false;

    logger.chat.info('[useTwitchChat] Screen changed:', {
      from: lastScreenRef.current,
      to: currentScreen,
      isOnChatScreen,
      wasOnChatScreen,
    });

    if (wasOnChatScreen && !isOnChatScreen) {
      logger.chat.info(
        '[useTwitchChat] Left chat/livestream screen, disconnecting IRC',
      );
    } else if (!wasOnChatScreen && isOnChatScreen) {
      logger.chat.info(
        '[useTwitchChat] Entered chat/livestream screen, ensuring IRC connection',
      );
      hasInitialized.current = true;
    }

    lastScreenRef.current = currentScreen;
  }, [currentScreen, shouldConnect]);

  useEffect(() => {
    const joinedChannels = joinedChannelsRef.current;
    return () => {
      logger.chat.info('[useTwitchChat] Cleaning up Twitch IRC client');
      joinedChannels.clear();
      messageBufferRef.current = '';
      hasInitialized.current = false;
      isAuthenticatedRef.current = false;
      userStateRef.current = {};
      pendingMessageRef.current = null;
      lastScreenRef.current = null;
    };
  }, []);

  /**
   * Send a chat message
   */
  const sendMessage = useCallback(
    (
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

      const ws = getWebSocketRef.current?.();
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        logger.chat.warn('Cannot send message - WebSocket not open');
        return;
      }

      const channelFormatted = channelName.startsWith('#')
        ? channelName
        : `#${channelName}`;

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
      ws.send(`${fullMessage}\r\n`);
    },
    [],
  );

  /**
   * Send an action message (/me)
   */
  const sendAction = useCallback(
    (channelName: string, action: string) => {
      const channelFormatted = channelName.startsWith('#')
        ? channelName
        : `#${channelName}`;

      // ACTION format: PRIVMSG #channel :\x01ACTION <message>\x01
      const actionMessage = `\x01ACTION ${action}\x01`;
      sendMessage(channelFormatted, actionMessage);
    },
    [sendMessage],
  );

  /**
   * Get current user state
   */
  const getUserState = useCallback((): Record<string, string> => {
    return { ...userStateRef.current };
  }, []);

  const isConnected = useCallback((): boolean => {
    const ws = getWebSocket();
    return ws.readyState === WebSocket.OPEN && isAuthenticatedRef.current;
  }, [getWebSocket]);

  return useMemo(
    () => ({
      getWebSocket,
      isConnected,
      joinChannel,
      partChannel,
      sendMessage,
      sendAction,
      getUserState,
    }),
    [
      getWebSocket,
      isConnected,
      joinChannel,
      partChannel,
      sendMessage,
      sendAction,
      getUserState,
    ],
  );
}
