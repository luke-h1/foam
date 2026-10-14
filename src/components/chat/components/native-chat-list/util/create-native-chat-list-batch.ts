import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { getChatMessageListKey } from '@app/utils/chat/message-identity/get-chat-message-list-key';
import type {
  NativeChatListBatch,
  NativeChatRow,
} from '@modules/native-chat-list/src/NativeChatList.types';

import { buildNativeChatRow } from './build-native-chat-row';
import { diffNativeChatRows } from './diff-native-chat-rows';
import type {
  NativeChatRowContext,
  NativeChatRowLiveState,
} from './native-row-context';
import { getNativeTextStyleTable } from './native-text-style-registry';

/**
 * What the native list holds now, as of the last batch. `rows[i]` is the row
 * built from `messages[i]`.
 */
export interface NativeChatListSentState {
  context: NativeChatRowContext;
  dataKey: string;
  messages: AnyChatMessageType[];
  rows: NativeChatRow[];
  styleCount: number;
}

interface CreateNativeChatListBatchOptions {
  context: NativeChatRowContext;
  dataKey: string;
  live: NativeChatRowLiveState;
  messages: AnyChatMessageType[];
  sent: NativeChatListSentState | null;
}

interface CreateNativeChatListBatchResult {
  batch: NativeChatListBatch | null;
  sent: NativeChatListSentState;
}

interface StyledBatch {
  batch: NativeChatListBatch;
  styleCount: number;
}

/**
 * Adds the text style table when the batch refers to a style the native list
 * does not have yet. A reset always carries it.
 */
function withStyles(
  batch: NativeChatListBatch,
  sentStyleCount: number,
): StyledBatch {
  const table = getNativeTextStyleTable();

  if (!batch.reset && table.length === sentStyleCount) {
    return { batch, styleCount: sentStyleCount };
  }

  return { batch: { ...batch, styles: [...table] }, styleCount: table.length };
}

/**
 * The batch that moves the native list from `sent` to `messages`. Rows kept
 * from the last batch are rebuilt through the row cache, so a changed message
 * or a changed live value sends only the rows it changed.
 */
export function createNativeChatListBatch({
  context,
  dataKey,
  live,
  messages,
  sent,
}: CreateNativeChatListBatchOptions): CreateNativeChatListBatchResult {
  const build = (message: AnyChatMessageType) =>
    buildNativeChatRow(message, context, live);

  const resetResult = (): CreateNativeChatListBatchResult => {
    const rows = messages.map(build);

    const { batch, styleCount } = withStyles(
      { reset: rows, removeFromStart: 0, append: [], update: [] },
      0,
    );

    return { batch, sent: { context, dataKey, messages, rows, styleCount } };
  };

  if (sent?.dataKey !== dataKey || sent.context !== context) {
    return resetResult();
  }

  if (sent.messages.length === 0 && messages.length === 0) {
    return { batch: null, sent };
  }

  const diff = diffNativeChatRows(
    sent.messages,
    messages,
    getChatMessageListKey,
  );

  if (diff.kind === 'reset') {
    return resetResult();
  }

  const overlap = messages.length - diff.appended.length;
  const rows: NativeChatRow[] = [];
  const update: NativeChatRow[] = [];

  for (const [index, message] of messages.slice(0, overlap).entries()) {
    const row = build(message);
    rows.push(row);

    if (row !== sent.rows[diff.removeFromStart + index]) {
      update.push(row);
    }
  }

  const append = diff.appended.map(build);
  rows.push(...append);

  const isUnchanged =
    diff.removeFromStart === 0 && append.length === 0 && update.length === 0;

  if (isUnchanged) {
    return { batch: null, sent: { ...sent, messages, rows } };
  }

  const { batch, styleCount } = withStyles(
    { removeFromStart: diff.removeFromStart, append, update },
    sent.styleCount,
  );

  return { batch, sent: { context, dataKey, messages, rows, styleCount } };
}
