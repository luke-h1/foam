import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chat-message.fixture';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type { NativeChatListBatch } from '@modules/native-chat-list/src/NativeChatList.types';

import { createNativeChatListBatch } from '../util/create-native-chat-list-batch';
import { getNativeTextStyleTable } from '../util/native-text-style-registry';
import {
  createNativeRowContext,
  createNativeRowLiveState,
} from './__fixtures__/build-native-chat-row.fixture';

function createMessage(id: string): AnyChatMessageType {
  return createChatMessageFixture({
    id,
    message_id: id,
    message_nonce: 'nonce',
  });
}

describe('createNativeChatListBatch', () => {
  test('resets with every row and the style table when nothing was sent', () => {
    const messages = [createMessage('a')];

    const { batch, sent } = createNativeChatListBatch({
      context: createNativeRowContext(),
      dataKey: 'channel',
      live: createNativeRowLiveState(),
      messages,
      sent: null,
    });

    expect(batch).toEqual<NativeChatListBatch>({
      reset: sent.rows,
      removeFromStart: 0,
      append: [],
      update: [],
      styles: [...getNativeTextStyleTable()],
    });
  });

  test('sends only appended rows when the style table did not grow', () => {
    const context = createNativeRowContext();
    const live = createNativeRowLiveState();
    const first = createMessage('a');

    const initial = createNativeChatListBatch({
      context,
      dataKey: 'channel',
      live,
      messages: [first],
      sent: null,
    });

    const { batch, sent } = createNativeChatListBatch({
      context,
      dataKey: 'channel',
      live,
      messages: [first, createMessage('b')],
      sent: initial.sent,
    });

    expect(batch).toEqual<NativeChatListBatch>({
      removeFromStart: 0,
      append: sent.rows.slice(1),
      update: [],
    });
  });

  test('updates a kept row when a live value it reads changes', () => {
    const context = createNativeRowContext();
    const message = createMessage('a');

    const initial = createNativeChatListBatch({
      context,
      dataKey: 'channel',
      live: createNativeRowLiveState(),
      messages: [message],
      sent: null,
    });

    const { batch, sent } = createNativeChatListBatch({
      context,
      dataKey: 'channel',
      live: createNativeRowLiveState({ highlightedReplyTargetId: 'a' }),
      messages: [message],
      sent: initial.sent,
    });

    expect(batch).toEqual<NativeChatListBatch>({
      removeFromStart: 0,
      append: [],
      update: sent.rows,
    });
  });

  test('sends nothing when no row changed', () => {
    const context = createNativeRowContext();
    const live = createNativeRowLiveState();
    const messages = [createMessage('a')];

    const initial = createNativeChatListBatch({
      context,
      dataKey: 'channel',
      live,
      messages,
      sent: null,
    });

    expect(
      createNativeChatListBatch({
        context,
        dataKey: 'channel',
        live,
        messages,
        sent: initial.sent,
      }).batch,
    ).toBeNull();
  });

  test('resets when the channel changes', () => {
    const context = createNativeRowContext();
    const live = createNativeRowLiveState();
    const messages = [createMessage('a')];

    const initial = createNativeChatListBatch({
      context,
      dataKey: 'channel',
      live,
      messages,
      sent: null,
    });

    const { batch } = createNativeChatListBatch({
      context,
      dataKey: 'other-channel',
      live,
      messages,
      sent: initial.sent,
    });

    expect(batch?.reset).toEqual(initial.sent.rows);
  });
});
