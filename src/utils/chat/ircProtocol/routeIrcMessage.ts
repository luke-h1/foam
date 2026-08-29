import type { IrcMessage } from '@app/utils/chat/ircProtocol/parseIrcMessage';

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
  part?: (channel: string, nick: string | undefined) => void;
  ping?: (server: string) => void;
  reconnect?: () => void;
  welcome?: () => void;
  motd?: (command: string, params: string[]) => void;
  namesReply?: (roomName: string) => void;
  unhandled?: (command: string, params: string[]) => void;
}

export function routeIrcMessage(
  message: IrcMessage,
  handlers: IrcRouteHandlers,
): void {
  const { command, params, prefix } = message;
  const tags = message.tags;
  const tagsRecord = tags ?? EMPTY_TAGS;

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
      if (params.length >= 2 && tags) {
        const channel = params[0];
        const text = params[1];
        // PRIVMSG tags carry no `login`; the canonical Twitch login is the
        // nick in the IRC prefix (`nick!user@host`), so derive it from there.
        if (!tags.login && prefix) {
          tags.login = prefix.split('!')[0] ?? '';
        }
        if (channel && text) {
          handlers.privmsg?.(channel, tags, text);
        }
      }
      break;
    }

    case 'RECONNECT':
      handlers.reconnect?.();
      break;

    case 'NOTICE': {
      if (params.length >= 2 && tags) {
        const channel = params[0];
        const text = params[1];
        if (channel && text) {
          handlers.notice?.(channel, tagsRecord, text);
        }
      } else if (params.length > 0) {
        handlers.channellessNotice?.(params.join(' '));
      }
      break;
    }

    case 'USERNOTICE': {
      if (params.length >= 1 && tags) {
        const channel = params[0];
        if (channel) {
          handlers.usernotice?.(channel, tagsRecord, params[1] ?? '');
        }
      }
      break;
    }

    case 'CLEARCHAT': {
      if (params.length >= 1 && tags) {
        const channel = params[0];
        const banDuration = tagsRecord['ban-duration']
          ? Number.parseInt(tagsRecord['ban-duration'], 10)
          : undefined;
        if (channel) {
          handlers.clearchat?.(channel, tagsRecord, params[1], banDuration);
        }
      }
      break;
    }

    case 'CLEARMSG':
    case 'CLEARMESSAGE': {
      if (params.length >= 1 && tags) {
        const channel = params[0];
        const targetMsgId = tagsRecord['target-msg-id'];
        if (channel && targetMsgId) {
          handlers.clearmsg?.(channel, tagsRecord, targetMsgId);
        }
      }
      break;
    }

    case 'ROOMSTATE': {
      if (params.length >= 1 && tags) {
        const channel = params[0];
        if (channel) {
          handlers.roomstate?.(channel, tagsRecord);
        }
      }
      break;
    }

    case 'USERSTATE': {
      if (params.length >= 1 && tags) {
        const channel = params[0];
        if (channel) {
          handlers.userstate?.(channel, tagsRecord);
        }
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
        handlers.part?.(channel, prefix?.split('!')[0]);
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
