import { normaliseLogin } from '@app/components/Chat/util/bufferedMessageOps/normaliseLogin';
import type { BufferedMessage } from '@app/components/Chat/util/bufferedMessageOps/types';

export const getBufferedMessageLogin = (message: BufferedMessage): string =>
  normaliseLogin(
    message.userstate?.login || message.userstate?.username || message.sender,
  );
