import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { ChatList } from '../ChatList';

const mockFlashList = jest.fn((_props: unknown) => (
  <View testID="flash-list" />
));

jest.mock('@app/components/FlashList/FlashList', () => ({
  FlashList: (props: unknown) => mockFlashList(props),
}));

describe('ChatList', () => {
  beforeEach(() => {
    mockFlashList.mockClear();
  });

  test('passes streaming chat tuning props to FlashList', () => {
    const listRef = { current: null };
    const isAtBottomRef = { current: true };

    render(
      <ChatList
        data={[]}
        extraData={{ showTimestamps: false }}
        listRef={listRef}
        isAtBottomRef={isAtBottomRef}
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
      />,
    );

    expect(mockFlashList).toHaveBeenCalledWith(
      expect.objectContaining({
        drawDistance: 320,
        extraData: { showTimestamps: false },
        maintainVisibleContentPosition: {
          autoscrollToBottomThreshold: 0.001,
          startRenderingFromBottom: true,
        },
        viewabilityConfig: {
          itemVisiblePercentThreshold: 1,
        },
      }),
    );
  });

  test('forwards visible messages from FlashList viewability', () => {
    const listRef = { current: null };
    const isAtBottomRef = { current: true };
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
        isAtBottomRef={isAtBottomRef}
        handleScroll={jest.fn()}
        handleScrollBeginDrag={jest.fn()}
        handleScrollEndDrag={jest.fn()}
        handleMomentumScrollEnd={jest.fn()}
        renderItem={jest.fn()}
        keyExtractor={jest.fn()}
        getItemType={jest.fn()}
        contentContainerStyle={undefined}
        onViewableMessagesChange={onViewableMessagesChange}
      />,
    );

    const props = mockFlashList.mock.calls[0]?.[0] as {
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
});
