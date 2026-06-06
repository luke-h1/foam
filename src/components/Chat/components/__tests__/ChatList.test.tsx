import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { View } from 'react-native';
import { ChatList } from '../ChatList';

const mockLegendList = jest.fn((_props: unknown) => (
  <View testID='flash-list' />
));

jest.mock('@legendapp/list', () => ({
  LegendList: (props: unknown) => mockLegendList(props),
}));

describe('ChatList', () => {
  beforeEach(() => {
    mockLegendList.mockClear();
  });

  test('passes streaming chat tuning props to LegendList', () => {
    const listRef = { current: null };
    const getEstimatedItemSize = jest.fn();

    render(
      <ChatList
        data={[]}
        extraData={{ showTimestamps: false }}
        listRef={listRef}
        shouldMaintainScrollAtEnd
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        getEstimatedItemSize={getEstimatedItemSize}
        contentContainerStyle={undefined}
      />,
    );

    const props = mockLegendList.mock.calls[0]?.[0] as {
      drawDistance?: number;
      estimatedItemSize?: number;
      extraData?: unknown;
      getEstimatedItemSize?: unknown;
      initialContainerPoolRatio?: number;
      maintainScrollAtEnd?: unknown;
      maintainScrollAtEndThreshold?: number;
      maintainVisibleContentPosition?: boolean;
      onEndReachedThreshold?: number;
      recycleItems?: boolean;
      viewabilityConfig?: unknown;
    };
    expect({
      drawDistance: props.drawDistance,
      estimatedItemSize: props.estimatedItemSize,
      extraData: props.extraData,
      getEstimatedItemSize: props.getEstimatedItemSize,
      initialContainerPoolRatio: props.initialContainerPoolRatio,
      maintainScrollAtEnd: props.maintainScrollAtEnd,
      maintainScrollAtEndThreshold: props.maintainScrollAtEndThreshold,
      maintainVisibleContentPosition: props.maintainVisibleContentPosition,
      onEndReachedThreshold: props.onEndReachedThreshold,
      recycleItems: props.recycleItems,
      viewabilityConfig: props.viewabilityConfig,
    }).toEqual({
      drawDistance: 96,
      estimatedItemSize: 34,
      extraData: { showTimestamps: false },
      getEstimatedItemSize,
      initialContainerPoolRatio: 1,
      maintainScrollAtEnd: {
        onDataChange: true,
      },
      maintainScrollAtEndThreshold: 0.1,
      maintainVisibleContentPosition: true,
      onEndReachedThreshold: 0.02,
      recycleItems: true,
      viewabilityConfig: {
        itemVisiblePercentThreshold: 1,
      },
    });
  });

  test('forwards visible messages from LegendList viewability', () => {
    const listRef = { current: null };
    const onViewableMessagesChange = jest.fn();
    const visibleMessage = {
      id: '1',
      message_id: '1',
      message_nonce: 'nonce',
      message: [{ type: 'text', content: 'hello' }],
      badges: [],
      channel: 'channel',
      sender: 'sender',
      timestamp: '00:00',
      userstate: {},
    };

    render(
      <ChatList
        data={[visibleMessage] as never}
        listRef={listRef}
        shouldMaintainScrollAtEnd
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
        onViewableMessagesChange={onViewableMessagesChange}
      />,
    );

    const props = mockLegendList.mock.calls[0]?.[0] as {
      onViewableItemsChanged: (info: { viewableItems: unknown[] }) => void;
    };

    props.onViewableItemsChanged({
      viewableItems: [
        { item: visibleMessage, isViewable: true },
        { item: { id: '2' }, isViewable: false },
      ],
    });

    expect(onViewableMessagesChange).toHaveBeenCalledWith([visibleMessage]);
  });

  test('does not refire visible-message hydration for the same visible rows', () => {
    const listRef = { current: null };
    const onViewableMessagesChange = jest.fn();
    const visibleMessage = {
      id: '1',
      message_id: '1',
      message_nonce: 'nonce',
      message: [{ type: 'text', content: 'hello' }],
      badges: [],
      channel: 'channel',
      sender: 'sender',
      timestamp: '00:00',
      userstate: {},
    };

    render(
      <ChatList
        data={[visibleMessage] as never}
        listRef={listRef}
        shouldMaintainScrollAtEnd
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
        onViewableMessagesChange={onViewableMessagesChange}
      />,
    );

    const props = mockLegendList.mock.calls[0]?.[0] as {
      onViewableItemsChanged: (info: { viewableItems: unknown[] }) => void;
    };
    const viewabilityPayload = {
      viewableItems: [{ item: visibleMessage, isViewable: true }],
    };

    props.onViewableItemsChanged(viewabilityPayload);
    props.onViewableItemsChanged(viewabilityPayload);

    expect(onViewableMessagesChange).toHaveBeenCalledTimes(1);
  });

  test('renders a skeleton row when LegendList asks for a not-yet-loaded cell', () => {
    const listRef = { current: null };

    render(
      <ChatList
        data={[]}
        listRef={listRef}
        shouldMaintainScrollAtEnd
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={jest.fn()}
        renderItem={jest.fn(() => null)}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    const props = mockLegendList.mock.calls[0]?.[0] as {
      renderItem: (info: {
        item: undefined;
        index: number;
        extraData: unknown;
      }) => ReactElement;
    };

    const { getByTestId } = render(
      props.renderItem({ item: undefined, index: 2, extraData: undefined }),
    );

    expect(getByTestId('chat-row-skeleton')).toBeOnTheScreen();
  });

  test('lets LegendList maintain the end without imperative growth scrolling', () => {
    const scrollToEnd = jest.fn();
    const listRef = { current: { scrollToEnd } };
    const message = {
      id: '1',
      message_id: '1',
      message_nonce: 'nonce',
      message: [{ type: 'text', content: 'hello' }],
      badges: [],
      channel: 'channel',
      sender: 'sender',
      timestamp: '00:00',
      userstate: {},
    };

    render(
      <ChatList
        data={[message] as never}
        listRef={listRef as never}
        shouldMaintainScrollAtEnd
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    expect(scrollToEnd).not.toHaveBeenCalled();
  });

  test('disables maintain-scroll-at-end when the user has left the bottom', () => {
    const listRef = { current: null };
    render(
      <ChatList
        data={[]}
        listRef={listRef}
        shouldMaintainScrollAtEnd={false}
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    const props = mockLegendList.mock.calls[0]?.[0] as {
      maintainScrollAtEnd?: unknown;
    };
    expect(props.maintainScrollAtEnd).toEqual(false);
  });

  test('updates maintain-scroll-at-end when anchoring is disabled after mount', () => {
    const listRef = { current: null };

    const { rerender } = render(
      <ChatList
        data={[]}
        listRef={listRef}
        shouldMaintainScrollAtEnd
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    rerender(
      <ChatList
        data={[]}
        listRef={listRef}
        shouldMaintainScrollAtEnd={false}
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    const props = mockLegendList.mock.calls.at(-1)?.[0] as {
      maintainScrollAtEnd?: unknown;
    };
    expect(props.maintainScrollAtEnd).toEqual(false);
  });

  test('passes bounded content-size anchoring through to LegendList', () => {
    const scrollToEnd = jest.fn();
    const listRef = { current: { scrollToEnd } };
    const handleContentSizeChange = jest.fn();

    render(
      <ChatList
        data={[]}
        listRef={listRef as never}
        shouldMaintainScrollAtEnd
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        handleEndReached={jest.fn()}
        handleContentSizeChange={handleContentSizeChange}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    const props = mockLegendList.mock.calls[0]?.[0] as {
      onContentSizeChange?: () => void;
    };

    expect(props.onContentSizeChange).toBe(handleContentSizeChange);
    expect(scrollToEnd).not.toHaveBeenCalled();
  });
});
