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

  test('passes chat-tuned props to LegendList', () => {
    const listRef = { current: null };

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
        contentContainerStyle={undefined}
      />,
    );

    const props = mockLegendList.mock.calls[0]?.[0] as {
      drawDistance?: number;
      estimatedItemSize?: number;
      extraData?: unknown;
      getEstimatedItemSize?: unknown;
      initialContainerPoolRatio?: number;
      maintainScrollAtEnd?: boolean | { onDataChange: boolean };
      maintainScrollAtEndThreshold?: number;
      onEndReachedThreshold?: number;
      recycleItems?: boolean;
      maintainVisibleContentPosition?: boolean;
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
      recycleItems: props.recycleItems,
      onEndReachedThreshold: props.onEndReachedThreshold,
      viewabilityConfig: props.viewabilityConfig,
    }).toEqual({
      drawDistance: 96,
      estimatedItemSize: 34,
      extraData: { showTimestamps: false },
      getEstimatedItemSize: undefined,
      initialContainerPoolRatio: 1,
      maintainScrollAtEnd: { onDataChange: true },
      maintainScrollAtEndThreshold: 0.1,
      maintainVisibleContentPosition: false,
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

  test('disables autoscroll-to-bottom when the user has scrolled away', () => {
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
      maintainScrollAtEnd?: boolean;
      maintainScrollAtEndThreshold?: number;
      maintainVisibleContentPosition?: boolean;
    };
    expect(props.maintainScrollAtEnd).toBe(false);
    expect(props.maintainScrollAtEndThreshold).toBe(0.1);
    expect(props.maintainVisibleContentPosition).toBe(true);
  });

  test('passes content-size change handler through to LegendList', () => {
    const listRef = { current: null };
    const handleContentSizeChange = jest.fn();

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
  });
});
