import type { IrcMessage } from '@app/utils/chat/irc-protocol/parse-irc-message';

const EMPTY_TAGS: Record<string, string> = Object.freeze({});

export interface IrcRouteHandlers {
  privmsg?: (
    channel: string,
    tags: Record<string, string>,
    text: string,
  ) => void;
  usernotice?: (
    channel: string,
    tags: Record<string, string>,
    text: string,
  ) => void;
  clearchat?: (
    channel: string,
    tags: Record<string, string>,
    targetUsername: string | undefined,
    banDuration: number | undefined,
  ) => void;
  clearmsg?: (
    channel: string,
    tags: Record<string, string>,
    targetMsgId: string,
  ) => void;
  notice?: (
    channel: string,
    tags: Record<string, string>,
    text: string,
  ) => void;
  channellessNotice?: (text: string) => void;
  roomstate?: (channel: string, tags: Record<string, string>) => void;
  userstate?: (channel: string, tags: Record<string, string>) => void;
  globaluserstate?: (tags: Record<string, string>) => void;
  join?: (channel: string, nick: string | undefined) => void;
  token?: (channel: string, nick: string | undefined) => void;
  ping?: (server: string) => void;
  reconnect?: () => void;
  welcome?: () => void;
  motd?: (command: string, params: string[]) => void;
  namesReply?: (roomName: string) => void;
  unhandled?: (command: string, params: string[]) => void;
}

/**
 * PRIVMSG tags carry no `login`; the canonical Twitch login is the nick in the
 * IRC prefix (`nick!user@host`), so derive it from there.
 */
function withPrefixLogin<TTags extends { login?: string }>(
  tags: TTags,
  prefix: string | undefined,
): TTags {
  if (!tags.login && prefix) {
    tags.login = prefix.split('!')[0] ?? '';
  }

  return tags;
}

export function routeIrcMessage(
  message: IrcMessage,
  handlers: IrcRouteHandlers,
): void {
  const { command, params, prefix } = message;
  const tags = message.tags;
  const tagsRecord = tags ?? EMPTY_TAGS;

  // Every tagged command addresses a channel in params[0]. A line missing
  // either the tags or the channel is malformed, and each case drops it.
  const taggedChannel = tags && params[0] ? params[0] : undefined;

  switch (command) {
    case '001':
      handlers.welcome?.();
      handlers.motd?.(command, params);
      break;

    case '002':
    case '003':
    case '004':
    case '375':
    case '372':
    case '376':
      handlers.motd?.(command, params);
      break;

    case 'PING':
      handlers.ping?.(params[0] || 'tmi.twitch.tv');
      break;

    case 'PRIVMSG': {
      const text = params[1];

      if (taggedChannel && text && tags) {
        handlers.privmsg?.(taggedChannel, withPrefixLogin(tags, prefix), text);
      }

      break;
    }

    case 'RECONNECT':
      handlers.reconnect?.();
      break;

    case 'NOTICE': {
      const isChannelNotice = params.length >= 2 && Boolean(tags);
      const text = params[1];

      if (isChannelNotice && taggedChannel && text) {
        handlers.notice?.(taggedChannel, tagsRecord, text);
      } else if (!isChannelNotice && params.length > 0) {
        handlers.channellessNotice?.(params.join(' '));
      }

      break;
    }

    case 'USERNOTICE': {
      if (taggedChannel) {
        handlers.usernotice?.(taggedChannel, tagsRecord, params[1] ?? '');
      }

      break;
    }

    case 'CLEARCHAT': {
      const banDuration = tagsRecord['ban-duration']
        ? Number.parseInt(tagsRecord['ban-duration'], 10)
        : undefined;

      if (taggedChannel) {
        handlers.clearchat?.(taggedChannel, tagsRecord, params[1], banDuration);
      }

      break;
    }

    case 'CLEARMSG':
    case 'CLEARMESSAGE': {
      const targetMsgId = tagsRecord['target-msg-id'];

      if (taggedChannel && targetMsgId) {
        handlers.clearmsg?.(taggedChannel, tagsRecord, targetMsgId);
      }

      break;
    }

    case 'ROOMSTATE': {
      if (taggedChannel) {
        handlers.roomstate?.(taggedChannel, tagsRecord);
      }

      break;
    }

    case 'USERSTATE': {
      if (taggedChannel) {
        handlers.userstate?.(taggedChannel, tagsRecord);
      }

      break;
    }

    case 'GLOBALUSERSTATE':
      handlers.globaluserstate?.(tagsRecord);
      break;

    case 'JOIN': {
      const channel = params[0];

      if (channel) {
        handlers.join?.(channel, prefix?.split('!')[0]);
      }

      break;
    }

    case 'PART': {
      const channel = params[0];

      if (channel) {
        handlers.token?.(channel, prefix?.split('!')[0]);
      }

      break;
    }

    case '353':
    case '366': {
      const roomName = params.find(param => param.startsWith('#'));

      if (roomName) {
        handlers.namesReply?.(roomName);
      }

      break;
    }

    default:
      handlers.unhandled?.(command, params);
  }
}
