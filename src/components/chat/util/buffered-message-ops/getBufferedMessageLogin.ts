import type { BufferedMessage } from '@app/components/chat/util/buffered-message-ops/types';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';

export const getBufferedMessageLogin = (message: BufferedMessage): string =>
  normaliseChatUsername(
    message.userstate?.login || message.userstate?.username || message.sender,
  );
