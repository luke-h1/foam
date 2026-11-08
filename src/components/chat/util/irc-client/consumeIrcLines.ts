import { chatPerfMarks } from '@app/lib/chatPerfMarks';
import { reportDroppedChatMessages } from '@app/utils/chat/chat-health/reportDroppedChatMessages';
import {
  MAX_INGESTED_PER_SEC,
  shouldProcessLiveMessage,
} from '@app/utils/chat/chatIngestRateLimiter';
import { isPrivmsgLine } from '@app/utils/chat/irc-protocol/isPrivmsgLine';
import {
  type IrcMessage,
  parseIrcMessage,
} from '@app/utils/chat/irc-protocol/parseIrcMessage';

export interface IrcLineHandlers {
  onDebugLine: (line: string, dropped?: boolean) => void;
  onLine: (message: IrcMessage) => void;
  onPing: () => void;
}

function dispatchIrcLine(line: string, handlers: IrcLineHandlers): void {
  if (!line) {
    return;
  }

  if (line === 'PING :tmi.twitch.tv') {
    handlers.onPing();
    return;
  }

  if (isPrivmsgLine(line) && !shouldProcessLiveMessage()) {
    handlers.onDebugLine(line, true);

    reportDroppedChatMessages(1, {
      reason: 'ingest-rate-limit',
      limitPerSecond: MAX_INGESTED_PER_SEC,
    });

    return;
  }

  handlers.onDebugLine(line);
  chatPerfMarks.lineReceived();

  const ircMessage = parseIrcMessage(line);

  if (ircMessage) {
    handlers.onLine(ircMessage);
  }
}

export function consumeIrcLines(
  text: string,
  handlers: IrcLineHandlers,
): string {
  let cursor = 0;

  while (cursor < text.length) {
    const lineEnd = text.indexOf('\r\n', cursor);

    if (lineEnd === -1) {
      break;
    }

    dispatchIrcLine(text.slice(cursor, lineEnd), handlers);
    cursor = lineEnd + 2;
  }

  return text.slice(cursor);
}
