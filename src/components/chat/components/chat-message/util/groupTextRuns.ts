import type { MessageToken } from '@app/types/chat/messageToken';
import { getMessageTokenText } from '@app/utils/chat/messageTokenContent';

export type TokenRun<T extends MessageToken> =
  | { content: string; index: number; kind: 'text' }
  | { index: number; kind: 'token'; token: T };

/**
 * Joins neighbouring text tokens into one run so each run renders as one Text
 * node. A run takes the index of its first token, which keeps its React key
 * stable while later tokens join it.
 */
export function groupTextRuns<T extends MessageToken>(
  message: readonly T[],
): TokenRun<T>[] {
  const runs: TokenRun<T>[] = [];
  let textRun: { content: string; index: number; kind: 'text' } | null = null;

  for (const [index, token] of message.entries()) {
    if (token.type !== 'text') {
      textRun = null;
      runs.push({ index, kind: 'token', token });
      continue;
    }

    const content = getMessageTokenText(token);

    if (textRun) {
      textRun.content += content;
      continue;
    }

    textRun = { content, index, kind: 'text' };
    runs.push(textRun);
  }

  return runs;
}
