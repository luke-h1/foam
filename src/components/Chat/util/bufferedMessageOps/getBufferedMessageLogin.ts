import type { BufferedMessage } from '@app/components/Chat/util/bufferedMessageOps/types';
import { normaliseChatUsername } from '@app/utils/chat/chatUsernames/normaliseChatUsername';

export const getBufferedMessageLogin = (message: BufferedMessage): string =>
  normaliseChatUsername(
    message.userstate?.login || message.userstate?.username || message.sender,
  );
