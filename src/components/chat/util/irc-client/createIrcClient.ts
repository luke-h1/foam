import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { applyAntiDuplicateSuffix } from '@app/utils/chat/applyAntiDuplicateSuffix';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { buildPrivmsgLine } from '@app/utils/chat/irc-protocol/buildPrivmsgLine';
import {
  type IrcRouteHandlers,
  routeIrcMessage,
} from '@app/utils/chat/irc-protocol/routeIrcMessage';
import { logger } from '@app/utils/logger';

import type { IrcCredentials } from './buildIrcCredentials';
import { consumeIrcLines, type IrcLineHandlers } from './consumeIrcLines';
import { formatIrcChannelName, formatIrcCommand } from './formatIrcCommand';

export interface IrcClientCallbacks {
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
}

interface ChannelMembership {
  joined: Set<string>;
  pending: Set<string>;
}

interface CreateChannelStateRouteHandlersOptions {
  getCallbacks: () => IrcClientCallbacks;
  isSelfNick: (nick: string | undefined) => boolean;
  markChannelJoined: (channelName: string) => void;
  membership: ChannelMembership;
  onUserState: (tags: Record<string, string>) => void;
}

function createChannelStateRouteHandlers({
  getCallbacks,
  isSelfNick,
  markChannelJoined,
  membership,
  onUserState,
}: CreateChannelStateRouteHandlersOptions): IrcRouteHandlers {
  return {
    roomstate: (channelName, tagsRecord) => {
      markChannelJoined(channelName);
      logger.chat.debug(`ROOMSTATE in ${channelName}`);
      getCallbacks().onRoomState?.(channelName, tagsRecord);
    },

    userstate: (channelName, tagsRecord) => {
      markChannelJoined(channelName);
      logger.chat.debug(`USERSTATE in ${channelName}`);
      onUserState(tagsRecord);
    },

    globaluserstate: tagsRecord => {
      logger.chat.debug('GLOBALUSERSTATE received');
      onUserState(tagsRecord);
    },

    join: (channelName, nick) => {
      if (isSelfNick(nick)) {
        markChannelJoined(channelName);
        logger.chat.info(`✅ Joined channel: ${channelName}`);
        getCallbacks().onJoin?.(channelName);
      } else if (nick) {
        getCallbacks().onUserJoin?.(channelName, nick);
      }
    },

    part: (channelName, nick) => {
      if (!isSelfNick(nick)) {
        getCallbacks().onUserPart?.(channelName, nick);
        return;
      }

      // A local partChannel already reported this PART; the server echo must not report it again.
      const wasJoined = membership.joined.delete(channelName);
      const wasPending = membership.pending.delete(channelName);

      if (wasJoined || wasPending) {
        logger.chat.info(`Left channel: ${channelName}`);
        getCallbacks().onPart?.(channelName);
      }
    },

    namesReply: roomName => {
      markChannelJoined(roomName);
    },
  };
}

function createChatMessageRouteHandlers(
  getCallbacks: () => IrcClientCallbacks,
): IrcRouteHandlers {
  return {
    privmsg: (channelName, tagsRecord, messageText) => {
      getCallbacks().onMessage?.(channelName, tagsRecord, messageText);
    },

    notice: (channelName, tagsRecord, messageText) => {
      logger.chat.info(`NOTICE in ${channelName}: ${messageText}`);
      getCallbacks().onNotice?.(channelName, tagsRecord, messageText);
    },

    channellessNotice: messageText => {
      logger.chat.info(`NOTICE: ${messageText}`);
    },

    usernotice: (channelName, tagsRecord, messageText) => {
      logger.chat.debug(
        `USERNOTICE in ${channelName}: ${tagsRecord['msg-id'] || 'unknown event'}`,
      );

      getCallbacks().onUserNotice?.(channelName, tagsRecord, messageText);
    },

    clearchat: (channelName, tagsRecord, username, banDuration) => {
      logger.chat.info(
        `CLEARCHAT in ${channelName}: ${username || 'all messages cleared'}`,
      );

      getCallbacks().onClearChat?.(
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
      getCallbacks().onClearMessage?.(channelName, tagsRecord, targetMsgId);
    },
  };
}

interface CreateIrcClientOptions {
  getCallbacks: () => IrcClientCallbacks;
  getChannel: () => string | undefined;
  onDebugLine: IrcLineHandlers['onDebugLine'];
  onUserState: (tags: Record<string, string>) => void;
  /**
   * Twitch sent RECONNECT. The owner closes the socket so it reconnects.
   */
  onServerReconnect: () => void;
}

export function createIrcClient({
  getCallbacks,
  getChannel,
  onDebugLine,
  onUserState,
  onServerReconnect,
}: CreateIrcClientOptions) {
  const membership: ChannelMembership = {
    joined: new Set<string>(),
    pending: new Set<string>(),
  };

  /**
   * What was last put on the wire per channel, so a repeat can be made distinct
   * before Twitch's duplicate filter swallows it.
   */
  const lastSentMessages = new Map<string, string>();

  let queuedLines: string[] = [];
  let lineBuffer = '';
  let isAuthenticated = false;
  let currentNick = '';
  let transport: ((line: string) => void) | null = null;

  const sendCommand = (command: string, ...params: string[]) => {
    const message = formatIrcCommand(command, params);

    logger.chat.debug(`Sending IRC command: ${message}`);
    const payload = `${message}\r\n`;

    if (!transport) {
      queuedLines.push(payload);
      return;
    }

    transport(payload);
  };

  // A JOIN/PART with no prefix, or one matching the nick we authenticated with,
  // is our own connection; anything else is another chatter.
  const isSelfNick = (nick: string | undefined) =>
    !nick ||
    !currentNick ||
    normaliseChatUsername(nick) === normaliseChatUsername(currentNick);

  const markChannelJoined = (channelName: string) => {
    const channelFormatted = formatIrcChannelName(channelName);
    membership.pending.delete(channelFormatted);
    membership.joined.add(channelFormatted);
  };

  const joinChannel = (channelName: string) => {
    if (!channelName) {
      return;
    }

    const channelFormatted = formatIrcChannelName(channelName);

    if (membership.joined.has(channelFormatted)) {
      logger.chat.debug(`Already joined channel: ${channelFormatted}`);
      return;
    }

    if (membership.pending.has(channelFormatted)) {
      logger.chat.debug(
        `Join already pending for channel: ${channelFormatted}`,
      );
      return;
    }

    logger.chat.info(`Joining channel: ${channelFormatted}`);
    membership.pending.add(channelFormatted);
    sendCommand('JOIN', channelFormatted);
  };

  const partChannel = (channelName: string) => {
    if (!channelName) {
      return;
    }

    const channelFormatted = formatIrcChannelName(channelName);

    const wasJoined = membership.joined.delete(channelFormatted);
    const wasPending = membership.pending.delete(channelFormatted);

    if (!wasJoined && !wasPending) {
      return;
    }

    logger.chat.info(`Parting from channel: ${channelFormatted}`);
    sendCommand('PART', channelFormatted);
    getCallbacks().onPart?.(channelFormatted);
  };

  const routeHandlers: IrcRouteHandlers = {
    motd: (command, params) => {
      logger.chat.debug(`IRC ${command}: ${params.join(' ')}`);
    },

    // Twitch drops a JOIN sent before the 001 welcome, so the first join waits for it.
    welcome: () => {
      isAuthenticated = true;
      logger.chat.info('✅ Authenticated with Twitch IRC');

      const channel = getChannel();

      if (channel) {
        joinChannel(channel);
      }
    },

    ping: server => {
      logger.chat.debug(`Received PING, sending PONG to ${server}`);
      sendCommand('PONG', server);
    },

    reconnect: () => {
      logger.chat.warn('Received Twitch IRC RECONNECT request');
      getCallbacks().onReconnect?.();
      onServerReconnect();
    },

    unhandled: (command, params) => {
      logger.chat.debug(
        `Unhandled IRC command: ${command} ${params.join(' ')}`,
      );
    },

    ...createChatMessageRouteHandlers(getCallbacks),

    ...createChannelStateRouteHandlers({
      getCallbacks,
      isSelfNick,
      markChannelJoined,
      membership,
      onUserState,
    }),
  };

  const resetConnection = () => {
    isAuthenticated = false;
    membership.joined.clear();
    membership.pending.clear();
    lineBuffer = '';
  };

  return {
    attachTransport(send: (line: string) => void): void {
      transport = send;
      queuedLines.splice(0).forEach(send);
    },

    detachTransport(send: (line: string) => void): void {
      if (transport === send) {
        transport = null;
      }
    },

    handleOpen(credentials: IrcCredentials): void {
      resetConnection();
      currentNick = credentials.nickname;
      sendCommand(`CAP REQ :${credentials.capabilities}`);
      sendCommand('PASS', credentials.passToken);
      sendCommand('NICK', credentials.nickname);
    },

    handleClose(): void {
      resetConnection();

      // A reconnect must not flush commands queued for a dead socket.
      queuedLines = [];
    },

    handleChunk(text: string): void {
      try {
        lineBuffer = consumeIrcLines(`${lineBuffer}${text}`, {
          onDebugLine,
          onLine: message => routeIrcMessage(message, routeHandlers),
          onPing: () => sendCommand('PONG', 'tmi.twitch.tv'),
        });
      } catch (error) {
        logger.chat.error('Failed to parse IRC message:', error);
        lineBuffer = '';
      }
    },

    joinChannel,
    partChannel,
    sendCommand,

    sendPrivmsg(
      channelName: string,
      message: string,
      replyParentMsgId?: string,
    ): void {
      if (message.trim().length === 0) {
        logger.chat.warn('Cannot send empty message');
        return;
      }

      const channelFormatted = formatIrcChannelName(channelName);

      const outgoing = applyAntiDuplicateSuffix(
        message,
        lastSentMessages.get(channelFormatted),
      );

      lastSentMessages.set(channelFormatted, outgoing);

      const fullMessage = buildPrivmsgLine({
        channel: channelFormatted,
        message: outgoing,
        replyParentMsgId,
      });

      logger.chat.debug(`Sending PRIVMSG: ${fullMessage.slice(0, 100)}...`);
      transport?.(`${fullMessage}\r\n`);
    },

    isAuthenticated: (): boolean => isAuthenticated,

    isJoined: (channelName: string): boolean =>
      membership.joined.has(formatIrcChannelName(channelName)),

    getJoinedChannel: (): string | undefined =>
      membership.joined.values().next().value,

    dispose(): void {
      resetConnection();
      lastSentMessages.clear();
    },
  };
}
