import { Profiler, useEffect } from 'react';
import { View } from 'react-native';
import type { ProfilerOnRenderCallback } from 'react';

import { render } from '@testing-library/react-native';
import { measureFunction, measureRenders } from 'reassure';

import type { ChatMessageType } from '@app/store/chat/types/constants';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { ChatList } from '../components/ChatList';
import { RichChatMessage } from '../components/ChatMessage/RichChatMessage';
import type { AnyChatMessageType } from '../util/messageHandlers';
import { estimateChatMessageHeightWithPretext } from '../util/pretextChatHeight';
import { getVisibleMessages } from '../util/visibleMessages';

jest.mock('@legendapp/list/react-native', () => {
  const React = require('react');
  const { View: MockView } = require('react-native');

  type MockLegendListProps = {
    data?: unknown;
    drawDistance?: unknown;
    estimatedItemSize?: unknown;
    extraData?: unknown;
    initialContainerPoolRatio?: unknown;
    keyExtractor?: unknown;
    maintainScrollAtEnd?: unknown;
    renderItem?: unknown;
  };

  const MOCK_VIEWPORT_HEIGHT = 680;
  const MOCK_FALLBACK_ROW_HEIGHT = 34;

  function getVirtualizedWindow(items: unknown[], props: MockLegendListProps) {
    const estimatedItemSize =
      typeof props.estimatedItemSize === 'number'
        ? props.estimatedItemSize
        : MOCK_FALLBACK_ROW_HEIGHT;
    const drawDistance =
      typeof props.drawDistance === 'number' ? props.drawDistance : 0;
    const initialContainerPoolRatio =
      typeof props.initialContainerPoolRatio === 'number'
        ? Math.max(1, props.initialContainerPoolRatio)
        : 1;
    const windowHeight = MOCK_VIEWPORT_HEIGHT * initialContainerPoolRatio;
    const rowCount = Math.ceil(
      (windowHeight + drawDistance * 2) / estimatedItemSize,
    );
    const count = Math.min(items.length, Math.max(1, rowCount));
    const startIndex = props.maintainScrollAtEnd
      ? Math.max(0, items.length - count)
      : 0;

    return {
      items: items.slice(startIndex, startIndex + count),
      startIndex,
    };
  }

  return {
    LegendList: React.forwardRef((props: MockLegendListProps, ref: unknown) => {
      const { data, extraData, keyExtractor, renderItem } = props;
      const items = Array.isArray(data) ? data : [];
      const renderRow = typeof renderItem === 'function' ? renderItem : null;
      const getKey = typeof keyExtractor === 'function' ? keyExtractor : null;
      const virtualizedWindow = getVirtualizedWindow(items, props);

      return React.createElement(
        MockView,
        { ref },
        virtualizedWindow.items.map((item, index) => {
          const dataIndex = virtualizedWindow.startIndex + index;
          return React.createElement(
            React.Fragment,
            { key: getKey ? getKey(item, dataIndex) : String(dataIndex) },
            renderRow
              ? renderRow({ extraData, index: dataIndex, item, target: 'Cell' })
              : null,
          );
        }),
      );
    }),
  };
});

type PerfChatMessage = ChatMessageType<'usernotice'>;

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

function createMessageParts(index: number): ParsedPart[] {
  const messageKind = index % 5;

  if (messageKind === 0) {
    return [
      { type: 'text', content: 'hello ' },
      { type: 'mention', content: '@luke' },
      { type: 'text', content: ` message ${index}` },
    ];
  }

  if (messageKind === 1) {
    return [
      { type: 'text', content: 'classic stack ' },
      {
        type: 'emote',
        content: 'WW',
        id: `emote-${index}`,
        name: 'WW',
        url: 'https://cdn.7tv.app/emote/01F71VQYHR000D3ZZ6Q11NR7TV/4x.avif',
        static_url:
          'https://cdn.7tv.app/emote/01F71VQYHR000D3ZZ6Q11NR7TV/4x_static.avif',
        width: 128,
        height: 128,
        aspect_ratio: 1,
        zero_width: false,
      },
    ];
  }

  if (messageKind === 2) {
    return [{ type: 'text', content: `searchable slowmode note ${index}` }];
  }

  return [{ type: 'text', content: `regular chat message ${index}` }];
}

function createChatMessage(index: number): PerfChatMessage {
  const senderIndex = index % 24;
  const sender = `user${senderIndex}`;

  return {
    id: `msg-${index}_nonce-${index}`,
    message_id: `msg-${index}`,
    message_nonce: `nonce-${index}`,
    sender,
    channel: 'xqc',
    badges: [],
    cachedSenderColor: 'rgb(145, 70, 255)',
    message: createMessageParts(index),
    replyBody: '',
    replyDisplayName: '',
    parentDisplayName: '',
    timestamp: '12:00',
    userstate: createUserStateTags({
      username: sender,
      login: sender.toLowerCase(),
      color: '#9146ff',
      'display-name': sender,
      'user-id': `user-id-${senderIndex}`,
      badges: {},
      'badges-raw': '',
      'user-type': '',
      mod: '0',
      subscriber: '0',
      turbo: '0',
      'emote-sets': '',
      id: `msg-${index}`,
    }),
  };
}

const chatWindow = Array.from({ length: 600 }, (_, index) =>
  createChatMessage(index),
);
const visibleRows = chatWindow.slice(-120);
const virtualizedVisibleRowCount = Math.ceil((680 + 96 * 2) / 34);
const virtualizedRows = visibleRows.slice(-virtualizedVisibleRowCount);

function isStandardUsernoticeMessage(
  message: AnyChatMessageType,
): message is PerfChatMessage {
  return !message.notice_tags;
}

function renderChatMessage(message: AnyChatMessageType) {
  if (!isStandardUsernoticeMessage(message)) {
    return null;
  }

  return (
    <RichChatMessage<'usernotice'>
      {...message}
      density='compact'
      currentUsername='luke'
      disableEmoteAnimations
    />
  );
}

function ChatListPerfFixture() {
  const listRef = { current: null };

  return (
    <ChatList
      data={visibleRows}
      extraData={{
        density: 'compact',
        showTimestamps: true,
      }}
      listRef={listRef}
      shouldMaintainScrollAtEnd
      handleScroll={jest.fn()}
      handleScrollBeginDrag={jest.fn()}
      handleScrollEndDrag={jest.fn()}
      handleMomentumScrollBegin={jest.fn()}
      handleMomentumScrollEnd={jest.fn()}
      handleEndReached={jest.fn()}
      handleContentSizeChange={jest.fn()}
      keyExtractor={(item, index) => item?.id ?? `missing-${index}`}
      getItemType={() => 'chat-message'}
      contentContainerStyle={undefined}
      renderItem={({ item }) => (item ? renderChatMessage(item) : null)}
    />
  );
}

function RichMessageRowsPerfFixture() {
  return (
    <View>
      {virtualizedRows.map(message => (
        <RichChatMessage
          key={message.id}
          {...message}
          density='compact'
          currentUsername='luke'
          disableEmoteAnimations
        />
      ))}
    </View>
  );
}

function RichMessageRowsMountFixture({
  onRowMount,
}: {
  onRowMount: (messageId: string) => void;
}) {
  return (
    <View>
      {virtualizedRows.map(message => (
        <TrackedRichChatMessage
          key={message.id}
          message={message}
          onRowMount={onRowMount}
        />
      ))}
    </View>
  );
}

function TrackedRichChatMessage({
  message,
  onRowMount,
}: {
  message: PerfChatMessage;
  onRowMount: (messageId: string) => void;
}) {
  useEffect(() => {
    onRowMount(message.id);
  }, [message.id, onRowMount]);

  return (
    <RichChatMessage
      {...message}
      density='compact'
      currentUsername='luke'
      disableEmoteAnimations
    />
  );
}

describe('chat performance', () => {
  test('renders the chat list window', async () => {
    await measureRenders(<ChatListPerfFixture />, MEASURE_OPTIONS);
  });

  test('renders visible chat message rows', async () => {
    await measureRenders(<RichMessageRowsPerfFixture />, MEASURE_OPTIONS);
  });

  test('filters the bounded chat window', async () => {
    await measureFunction(() => {
      getVisibleMessages(chatWindow, {
        currentUsername: 'luke',
        hiddenPhrases: ['slowmode'],
        hiddenUsers: ['user7', 'user11'],
        searchQuery: 'message',
        showOnlyMentions: false,
      });
    }, MEASURE_OPTIONS);
  });

  test('estimates plain chat row heights with pretext', async () => {
    await measureFunction(() => {
      for (const message of virtualizedRows) {
        estimateChatMessageHeightWithPretext(message, {
          containerWidth: 390,
          density: 'compact',
          showInlineReplyContext: true,
          showTimestamp: true,
        });
      }
    }, MEASURE_OPTIONS);
  });

  test('keeps visible row mounts stable across unchanged rerenders', () => {
    const onRowMount = jest.fn();
    const onRender = jest.fn<
      ReturnType<ProfilerOnRenderCallback>,
      Parameters<ProfilerOnRenderCallback>
    >();

    const { rerender } = render(
      <Profiler id='rich-message-rows' onRender={onRender}>
        <RichMessageRowsMountFixture onRowMount={onRowMount} />
      </Profiler>,
    );

    expect(onRowMount).toHaveBeenCalledTimes(virtualizedRows.length);
    expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual(['mount']);

    rerender(
      <Profiler id='rich-message-rows' onRender={onRender}>
        <RichMessageRowsMountFixture onRowMount={onRowMount} />
      </Profiler>,
    );

    expect(onRowMount).toHaveBeenCalledTimes(virtualizedRows.length);
    expect(onRender.mock.calls.map(([, phase]) => phase)).toEqual([
      'mount',
      'update',
    ]);
  });
});
