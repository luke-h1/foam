import { Fragment, Profiler, useEffect } from 'react';
import { View } from 'react-native';
import type { ProfilerOnRenderCallback, ReactElement, Ref } from 'react';

import type {
  LegendListComponent,
  MaintainScrollAtEndOptions,
} from '@legendapp/list/react-native';
import { render } from '@testing-library/react-native';
import { measureFunction, measureRenders } from 'reassure';

import type { ChatDensity } from '@app/components/Chat/components/ChatMessage/chatScale';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { ChatList } from '../components/ChatList';
import { RichChatMessage } from '../components/ChatMessage/RichChatMessage';
import { getVisibleMessages } from '../util/visibleMessages';

type MockExtraData = {
  density: ChatDensity;
  showTimestamps: boolean;
};

type MockRenderItemInfo = {
  extraData: MockExtraData | undefined;
  index: number;
  item: AnyChatMessageType;
  target: 'Cell';
};

type MockLegendListProps = {
  data?: readonly AnyChatMessageType[];
  drawDistance?: number;
  estimatedItemSize?: number;
  extraData?: MockExtraData;
  initialContainerPoolRatio?: number;
  keyExtractor?: (item: AnyChatMessageType, index: number) => string;
  maintainScrollAtEnd?: MaintainScrollAtEndOptions | false;
  renderItem?: (info: MockRenderItemInfo) => ReactElement | null;
};

const MOCK_VIEWPORT_HEIGHT = 680;
const MOCK_FALLBACK_ROW_HEIGHT = 34;

function getVirtualizedWindow(
  items: readonly AnyChatMessageType[],
  props: MockLegendListProps,
) {
  const estimatedItemSize = props.estimatedItemSize ?? MOCK_FALLBACK_ROW_HEIGHT;
  const drawDistance = props.drawDistance ?? 0;
  const initialContainerPoolRatio = Math.max(
    1,
    props.initialContainerPoolRatio ?? 1,
  );
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

/**
 * `__mocks__/@legendapp/list/react-native.tsx` already stubs `LegendList` for
 * every test, but its default renders every row - this suite measures the
 * virtualized window itself, so it overrides that export with a fake that
 * windows rows the way the real list does.
 *
 * Pulled in via `require`, not `import`: a named import only gives a local
 * binding, not the module object `jest.spyOn` needs to patch, and a namespace
 * import goes through babel's ES-interop copy instead of the object
 * `ChatList` actually reads `LegendList` off.
 */
// SAFETY: `require` erases module typing; this reattaches the real
// `@legendapp/list/react-native` module type so `jest.spyOn` below type-checks.
const legendListReactNative =
  require('@legendapp/list/react-native') as typeof import('@legendapp/list/react-native');

jest.spyOn(legendListReactNative, 'LegendList').mockImplementation(
  // SAFETY: the mock only exercises the props this suite reads; it doesn't
  // implement every prop `LegendListComponent` accepts.
  ((props: MockLegendListProps & { ref?: Ref<View> }) => {
    const { extraData, keyExtractor, ref, renderItem } = props;
    const items = props.data ?? [];
    const virtualizedWindow = getVirtualizedWindow(items, props);

    return (
      <View ref={ref}>
        {virtualizedWindow.items.map((item, index) => {
          const dataIndex = virtualizedWindow.startIndex + index;
          return (
            <Fragment
              key={
                keyExtractor ? keyExtractor(item, dataIndex) : String(dataIndex)
              }
            >
              {renderItem
                ? renderItem({
                    extraData,
                    index: dataIndex,
                    item,
                    target: 'Cell',
                  })
                : null}
            </Fragment>
          );
        })}
      </View>
    );
  }) as LegendListComponent,
);

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
      messageDisplay={{ disableEmoteAnimations: true }}
    />
  );
}

function ChatListPerfFixture() {
  const listRef = { current: null };

  return (
    <ChatList
      data={visibleRows}
      dataKey='perf-channel'
      extraData={{
        density: 'compact',
        showTimestamps: true,
      }}
      listRef={listRef}
      shouldMaintainScrollAtEnd
      scrollHandlers={{
        onContentSizeChange: jest.fn(),
        onEndReached: jest.fn(),
        onMomentumScrollBegin: jest.fn(),
        onMomentumScrollEnd: jest.fn(),
        onScroll: jest.fn(),
        onScrollBeginDrag: jest.fn(),
        onScrollEndDrag: jest.fn(),
      }}
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
          messageDisplay={{ disableEmoteAnimations: true }}
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
      messageDisplay={{ disableEmoteAnimations: true }}
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
