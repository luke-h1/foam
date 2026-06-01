import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { View } from 'react-native';
import { ChatList } from '../ChatList';

const mockLegendList = jest.fn((_props: unknown) => (
  <View testID="flash-list" />
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

    expect(mockLegendList).toHaveBeenCalledWith(
      expect.objectContaining({
        drawDistance: 960,
        estimatedItemSize: 18,
        extraData: { showTimestamps: false },
        getEstimatedItemSize,
        initialContainerPoolRatio: 3,
        maintainScrollAtEnd: {
          onDataChange: true,
          onItemLayout: true,
          onLayout: true,
        },
        maintainScrollAtEndThreshold: 0.001,
        maintainVisibleContentPosition: true,
        recycleItems: true,
        viewabilityConfig: {
          itemVisiblePercentThreshold: 1,
        },
        onEndReachedThreshold: 0.02,
      }),
    );
  });

  test('forwards visible messages from FlashList viewability', () => {
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

    expect(getByTestId('chat-row-skeleton')).toBeTruthy();
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

    expect(mockLegendList).toHaveBeenCalledWith(
      expect.objectContaining({
        maintainScrollAtEnd: false,
      }),
    );
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

    expect(mockLegendList).toHaveBeenLastCalledWith(
      expect.objectContaining({
        maintainScrollAtEnd: false,
      }),
    );
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
