import { StyleSheet, View } from 'react-native';
import type { ComponentProps, ReactElement } from 'react';
import { makeMutable } from 'react-native-reanimated';

import type {
  MaintainScrollAtEndOptions,
  ViewabilityConfig,
} from '@legendapp/list/react-native';
import { render } from '@testing-library/react-native';

import { createChatMessageFixture } from '@app/components/chat/util/__tests__/__fixtures__/chatMessage.fixture';
import type { ViewableMessageToken } from '@app/components/chat/util/getViewableChatMessages';
import { preferences$ } from '@app/store/preference-store';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';

import { ChatList } from '../ChatList';

interface LegendListMockProps {
  dataKey: string;
  drawDistance: number;
  estimatedItemSize: number;
  extraData: unknown;
  maintainScrollAtEnd: boolean | MaintainScrollAtEndOptions;
  maintainScrollAtEndThreshold: number;
  maintainVisibleContentPosition: boolean | undefined;
  onContentSizeChange: () => void;
  onEndReachedThreshold: number;
  onScroll: () => void;
  onViewableItemsChanged: (info: {
    viewableItems: ViewableMessageToken[];
  }) => void;
  recycleItems: boolean;
  scrollEventThrottle: number | undefined;
  renderItem: (info: {
    item: AnyChatMessageType | undefined;
    index: number;
    extraData: unknown;
  }) => ReactElement;
  viewabilityConfig: ViewabilityConfig;
}

const mockLegendList = jest.fn((_props: LegendListMockProps) => (
  <View testID='flash-list' />
));

const contentInsetEndAdjustment = makeMutable(0);

/**
 * Override the global KeyboardAwareLegendList mock with a fake that records props.
 * `require`, not `import` - spyOn needs the module object, not babel's ES-interop copy.
 */
// SAFETY: reattaches the module type `require` erases so spyOn type-checks.
const legendListKeyboard =
  require('@legendapp/list/keyboard') as typeof import('@legendapp/list/keyboard');

jest.spyOn(legendListKeyboard, 'KeyboardAwareLegendList').mockImplementation(
  // SAFETY: the mock implements only the props this suite reads.
  ((props: LegendListMockProps) =>
    mockLegendList(props)) as typeof legendListKeyboard.KeyboardAwareLegendList,
);

function getRenderedProps(): LegendListMockProps {
  const call = mockLegendList.mock.calls[0];

  if (!call) {
    throw new Error('KeyboardAwareLegendList did not render');
  }

  return call[0];
}

function createChatListElement(
  overrides: Partial<ComponentProps<typeof ChatList>> = {},
) {
  return (
    <ChatList
      contentInsetEndAdjustment={contentInsetEndAdjustment}
      data={[]}
      dataKey='test-channel'
      listRef={{ current: null }}
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
      {...overrides}
    />
  );
}

const visibleMessage = createChatMessageFixture({
  id: '1_nonce',
  message_id: '1',
  message_nonce: 'nonce',
  timestamp: '00:00',
});

describe('ChatList', () => {
  beforeEach(() => {
    mockLegendList.mockClear();
  });

  test('keeps the list pinned to the end while the user is at the bottom', () => {
    render(createChatListElement({ extraData: { showTimestamps: false } }));

    const props = getRenderedProps();

    expect({
      extraData: props.extraData,
      maintainScrollAtEnd: props.maintainScrollAtEnd,
      maintainVisibleContentPosition: props.maintainVisibleContentPosition,
      recycleItems: props.recycleItems,
    }).toEqual({
      extraData: { showTimestamps: false },
      maintainScrollAtEnd: { on: { dataChange: true, itemLayout: true } },
      maintainVisibleContentPosition: undefined,
      recycleItems: true,
    });
  });

  test('disables autoscroll-to-bottom when the user has scrolled away', () => {
    render(createChatListElement({ shouldMaintainScrollAtEnd: false }));

    const props = getRenderedProps();

    expect({
      maintainScrollAtEnd: props.maintainScrollAtEnd,
      maintainVisibleContentPosition: props.maintainVisibleContentPosition,
    }).toEqual({
      maintainScrollAtEnd: false,
      maintainVisibleContentPosition: true,
    });
  });

  test('forwards only the viewable messages', () => {
    const onViewableMessagesChange = jest.fn();

    render(
      createChatListElement({
        data: [visibleMessage],
        onViewableMessagesChange,
      }),
    );

    getRenderedProps().onViewableItemsChanged({
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

    expect(onViewableMessagesChange.mock.calls).toEqual([[[visibleMessage]]]);
  });

  test('forwards every viewability callback without app-side diffing', () => {
    const onViewableMessagesChange = jest.fn();

    render(
      createChatListElement({
        data: [visibleMessage],
        onViewableMessagesChange,
      }),
    );

    const props = getRenderedProps();

    const viewabilityPayload = {
      viewableItems: [{ item: visibleMessage, isViewable: true }],
    };

    props.onViewableItemsChanged(viewabilityPayload);
    props.onViewableItemsChanged(viewabilityPayload);

    expect(onViewableMessagesChange.mock.calls).toEqual([
      [[visibleMessage]],
      [[visibleMessage]],
    ]);
  });

  test('renders a skeleton row when LegendList asks for a not-yet-loaded cell', () => {
    render(createChatListElement());

    const { getByTestId } = render(
      getRenderedProps().renderItem({
        item: undefined,
        index: 2,
        extraData: undefined,
      }),
    );

    expect(getByTestId('chat-row-skeleton')).toBeOnTheScreen();
  });

  test('sizes the skeleton row from the live font scale and density', () => {
    preferences$.chatFontScale.set('large');
    preferences$.chatDensity.set('compact');

    render(createChatListElement());

    const { getByTestId } = render(
      getRenderedProps().renderItem({
        item: undefined,
        index: 0,
        extraData: undefined,
      }),
    );

    const { minHeight, paddingVertical } = StyleSheet.flatten(
      getByTestId('chat-row-skeleton').props['style'],
    );

    preferences$.chatFontScale.set('default');
    preferences$.chatDensity.set('comfortable');

    expect({ minHeight, paddingVertical }).toEqual({
      minHeight: 25,
      paddingVertical: 2,
    });
  });

  test('passes the scroll handler to LegendList without its JS throttle', () => {
    const onScroll = jest.fn();

    render(
      createChatListElement({
        scrollHandlers: {
          onContentSizeChange: jest.fn(),
          onEndReached: jest.fn(),
          onMomentumScrollBegin: jest.fn(),
          onMomentumScrollEnd: jest.fn(),
          onScroll,
          onScrollBeginDrag: jest.fn(),
          onScrollEndDrag: jest.fn(),
        },
      }),
    );

    const props = getRenderedProps();

    expect({
      onScroll: props.onScroll,
      scrollEventThrottle: props.scrollEventThrottle,
    }).toEqual({ onScroll, scrollEventThrottle: undefined });
  });

  test('forwards the dataset identity to LegendList', () => {
    const { rerender } = render(
      createChatListElement({ dataKey: 'channel-a' }),
    );
    rerender(createChatListElement({ dataKey: 'channel-b' }));

    const dataKeys = mockLegendList.mock.calls.map(call => call[0].dataKey);

    expect(dataKeys).toEqual(['channel-a', 'channel-b']);
  });
});
