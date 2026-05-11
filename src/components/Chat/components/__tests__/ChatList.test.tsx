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
      }),
    );
  });
});
