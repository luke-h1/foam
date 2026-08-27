import { View } from 'react-native';
import type { ReactElement } from 'react';

import type {
  LegendListComponent,
  MaintainScrollAtEndOptions,
  ViewabilityConfig,
} from '@legendapp/list/react-native';
import { render } from '@testing-library/react-native';

import { createChatMessageFixture } from '@app/components/Chat/util/__tests__/__fixtures__/chatMessage.fixture';
import type { ViewableMessageToken } from '@app/components/Chat/util/getViewableChatMessages';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';

import { ChatList } from '../ChatList';

type LegendListMockProps = {
  dataKey: string;
  drawDistance: number;
  estimatedItemSize: number;
  extraData: unknown;
  maintainScrollAtEnd: boolean | MaintainScrollAtEndOptions;
  maintainScrollAtEndThreshold: number;
  maintainVisibleContentPosition: boolean | undefined;
  onContentSizeChange: () => void;
  onEndReachedThreshold: number;
  onViewableItemsChanged: (info: {
    viewableItems: ViewableMessageToken[];
  }) => void;
  recycleItems: boolean;
  renderItem: (info: {
    item: AnyChatMessageType | undefined;
    index: number;
    extraData: unknown;
  }) => ReactElement;
  viewabilityConfig: ViewabilityConfig;
};

const mockLegendList = jest.fn((_props: LegendListMockProps) => (
  <View testID='flash-list' />
));

/**
 * Override the global LegendList mock with a fake that records props.
 * `require`, not `import` - spyOn needs the module object, not babel's ES-interop copy.
 */
// SAFETY: reattaches the module type `require` erases so spyOn type-checks.
const legendListReactNative =
  require('@legendapp/list/react-native') as typeof import('@legendapp/list/react-native');

jest.spyOn(legendListReactNative, 'LegendList').mockImplementation(
  // SAFETY: the mock implements only the props this suite reads.
  ((props: LegendListMockProps) =>
    mockLegendList(props)) as LegendListComponent,
);

function getRenderedProps(): LegendListMockProps {
  const call = mockLegendList.mock.calls[0];
  if (!call) {
    throw new Error('LegendList did not render');
  }
  return call[0];
}

describe('ChatList', () => {
  beforeEach(() => {
    mockLegendList.mockClear();
  });

  test('passes chat-tuned props to LegendList', () => {
    const listRef = { current: null };

    render(
      <ChatList
        data={[]}
        dataKey='test-channel'
        extraData={{ showTimestamps: false }}
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
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    const props = getRenderedProps();
    expect({
      drawDistance: props.drawDistance,
      estimatedItemSize: props.estimatedItemSize,
      extraData: props.extraData,
      maintainScrollAtEnd: props.maintainScrollAtEnd,
      maintainScrollAtEndThreshold: props.maintainScrollAtEndThreshold,
      maintainVisibleContentPosition: props.maintainVisibleContentPosition,
      recycleItems: props.recycleItems,
      onEndReachedThreshold: props.onEndReachedThreshold,
      viewabilityConfig: props.viewabilityConfig,
    }).toEqual({
      drawDistance: 250,
      estimatedItemSize: 26,
      extraData: { showTimestamps: false },
      maintainScrollAtEnd: { on: { dataChange: true, itemLayout: true } },
      maintainScrollAtEndThreshold: 0.1,
      maintainVisibleContentPosition: undefined,
      recycleItems: false,
      onEndReachedThreshold: 0.02,
      viewabilityConfig: {
        itemVisiblePercentThreshold: 1,
      },
    });
  });

  test('forwards visible messages from LegendList viewability', () => {
    const listRef = { current: null };
    const onViewableMessagesChange = jest.fn();
    const visibleMessage = createChatMessageFixture({
      id: '1_nonce',
      message_id: '1',
      message_nonce: 'nonce',
      timestamp: '00:00',
    });

    render(
      <ChatList
        data={[visibleMessage]}
        dataKey='test-channel'
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
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
        onViewableMessagesChange={onViewableMessagesChange}
      />,
    );

    const props = getRenderedProps();

    props.onViewableItemsChanged({
      viewableItems: [
        { item: visibleMessage, isViewable: true },
        {
          item: createChatMessageFixture({
            id: '2_nonce',
            message_id: '2',
            message_nonce: 'nonce',
            timestamp: '00:00',
          }),
          isViewable: false,
        },
      ],
    });

    expect(onViewableMessagesChange).toHaveBeenCalledWith([visibleMessage]);
  });

  test('forwards every viewability callback without app-side diffing', () => {
    const listRef = { current: null };
    const onViewableMessagesChange = jest.fn();
    const visibleMessage = createChatMessageFixture({
      id: '1_nonce',
      message_id: '1',
      message_nonce: 'nonce',
      timestamp: '00:00',
    });

    render(
      <ChatList
        data={[visibleMessage]}
        dataKey='test-channel'
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
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
        onViewableMessagesChange={onViewableMessagesChange}
      />,
    );

    const props = getRenderedProps();
    const viewabilityPayload = {
      viewableItems: [{ item: visibleMessage, isViewable: true }],
    };

    props.onViewableItemsChanged(viewabilityPayload);
    props.onViewableItemsChanged(viewabilityPayload);

    expect(onViewableMessagesChange).toHaveBeenCalledTimes(2);
    expect(onViewableMessagesChange).toHaveBeenLastCalledWith([visibleMessage]);
  });

  test('renders a skeleton row when LegendList asks for a not-yet-loaded cell', () => {
    const listRef = { current: null };

    render(
      <ChatList
        data={[]}
        dataKey='test-channel'
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
        renderItem={jest.fn(() => null)}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    const props = getRenderedProps();

    const { getByTestId } = render(
      props.renderItem({ item: undefined, index: 2, extraData: undefined }),
    );

    expect(getByTestId('chat-row-skeleton')).toBeOnTheScreen();
  });

  test('disables autoscroll-to-bottom when the user has scrolled away', () => {
    const listRef = { current: null };
    render(
      <ChatList
        data={[]}
        dataKey='test-channel'
        listRef={listRef}
        shouldMaintainScrollAtEnd={false}
        scrollHandlers={{
          onContentSizeChange: jest.fn(),
          onEndReached: jest.fn(),
          onMomentumScrollBegin: jest.fn(),
          onMomentumScrollEnd: jest.fn(),
          onScroll: jest.fn(),
          onScrollBeginDrag: jest.fn(),
          onScrollEndDrag: jest.fn(),
        }}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    const props = getRenderedProps();
    expect(props.maintainScrollAtEnd).toBe(false);
    expect(props.maintainScrollAtEndThreshold).toBe(0.1);
    expect(props.maintainVisibleContentPosition).toBe(true);
  });

  test('passes content-size change handler through to LegendList', () => {
    const listRef = { current: null };
    const onContentSizeChange = jest.fn();

    render(
      <ChatList
        data={[]}
        dataKey='test-channel'
        listRef={listRef}
        shouldMaintainScrollAtEnd
        scrollHandlers={{
          onContentSizeChange,
          onEndReached: jest.fn(),
          onMomentumScrollBegin: jest.fn(),
          onMomentumScrollEnd: jest.fn(),
          onScroll: jest.fn(),
          onScrollBeginDrag: jest.fn(),
          onScrollEndDrag: jest.fn(),
        }}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    const props = getRenderedProps();

    expect(props.onContentSizeChange).toBe(onContentSizeChange);
  });

  test('forwards the dataset identity to LegendList', () => {
    const listRef = { current: null };
    const renderList = (dataKey: string) => (
      <ChatList
        data={[]}
        dataKey={dataKey}
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
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />
    );

    const { rerender } = render(renderList('channel-a'));
    rerender(renderList('channel-b'));

    const dataKeys = mockLegendList.mock.calls.map(call => call[0].dataKey);

    expect(dataKeys).toEqual(['channel-a', 'channel-b']);
  });
});
