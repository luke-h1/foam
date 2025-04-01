import type { Message } from 'ircv3';

export default function getIrcChannelName(msg: Message) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-underscore-dangle
  return (msg as any)._params[0].value.slice(1);
}
