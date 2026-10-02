import { StyleSheet, Text, type ViewStyle } from 'react-native';

import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
} from '@testing-library/react-native';

import { ChatMessagePressable } from '@app/components/chat/components/chat-message/chat-message-pressable';

function touchAt(pageX: number, pageY: number) {
  return { nativeEvent: { pageX, pageY } };
}

describe('ChatMessagePressable', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders a plain view when nothing listens for a press', () => {
    render(
      <ChatMessagePressable testID='target'>
        <Text>badge</Text>
      </ChatMessagePressable>,
    );

    expect(screen.getByTestId('target').props.onStartShouldSetResponder).toBe(
      undefined,
    );
  });

  test('a tap fires onPress once', async () => {
    const onPress = jest.fn();

    render(
      <ChatMessagePressable onPress={onPress} testID='target'>
        <Text>badge</Text>
      </ChatMessagePressable>,
    );

    await userEvent.press(screen.getByTestId('target'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('shows the pressed highlight while the touch is down', () => {
    jest.useFakeTimers();

    render(
      <ChatMessagePressable
        onPress={jest.fn()}
        style={{ padding: 2 }}
        testID='target'
      >
        <Text>badge</Text>
      </ChatMessagePressable>,
    );

    const target = screen.getByTestId('target');

    fireEvent(target, 'responderGrant', touchAt(10, 10));

    const pressedStyle = StyleSheet.flatten<ViewStyle>(
      screen.getByTestId('target').props.style,
    );

    expect({
      backgroundColor: pressedStyle.backgroundColor,
      padding: pressedStyle.padding,
    }).toEqual({
      backgroundColor: 'rgba(153, 153, 153, 0.24)',
      padding: 2,
    });

    fireEvent(target, 'responderRelease', touchAt(10, 10));

    // A quick tap keeps the highlight for the minimum press duration.
    expect(
      StyleSheet.flatten<ViewStyle>(screen.getByTestId('target').props.style)
        .backgroundColor,
    ).toEqual('rgba(153, 153, 153, 0.24)');

    act(() => {
      jest.advanceTimersByTime(130);
    });

    expect(
      StyleSheet.flatten<ViewStyle>(screen.getByTestId('target').props.style),
    ).toEqual({ padding: 2 });
  });

  test('a touch that drags away is a scroll, not a press', () => {
    const onPress = jest.fn();

    render(
      <ChatMessagePressable onPress={onPress} testID='target'>
        <Text>badge</Text>
      </ChatMessagePressable>,
    );

    const target = screen.getByTestId('target');

    fireEvent(target, 'responderGrant', touchAt(10, 10));
    fireEvent(target, 'responderMove', touchAt(10, 60));
    fireEvent(target, 'responderRelease', touchAt(10, 60));

    expect(onPress).not.toHaveBeenCalled();
  });

  test('a touch the list takes over does not press', () => {
    const onPress = jest.fn();

    render(
      <ChatMessagePressable onPress={onPress} testID='target'>
        <Text>badge</Text>
      </ChatMessagePressable>,
    );

    const target = screen.getByTestId('target');

    fireEvent(target, 'responderGrant', touchAt(10, 10));
    fireEvent(target, 'responderTerminate', touchAt(10, 10));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('target').props.style).toEqual(undefined);
  });

  test('a long press fires onLongPress and swallows the press', () => {
    jest.useFakeTimers();
    const onPress = jest.fn();
    const onLongPress = jest.fn();

    render(
      <ChatMessagePressable
        onLongPress={onLongPress}
        onPress={onPress}
        testID='target'
      >
        <Text>badge</Text>
      </ChatMessagePressable>,
    );

    const target = screen.getByTestId('target');

    fireEvent(target, 'responderGrant', touchAt(10, 10));
    jest.advanceTimersByTime(500);
    fireEvent(target, 'responderRelease', touchAt(10, 10));

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  test('a disabled target does not take the touch', () => {
    render(
      <ChatMessagePressable disabled onPress={jest.fn()} testID='target'>
        <Text>badge</Text>
      </ChatMessagePressable>,
    );

    const target = screen.getByTestId('target');

    expect({
      accessibilityState: target.props.accessibilityState,
      responds: target.props.onStartShouldSetResponder(),
    }).toEqual({
      accessibilityState: { disabled: true },
      responds: false,
    });
  });

  test('screen readers activate and long-press through accessibility actions', () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();

    render(
      <ChatMessagePressable
        onPress={onPress}
        onLongPress={onLongPress}
        testID='target'
      >
        <Text>badge</Text>
      </ChatMessagePressable>,
    );

    const target = screen.getByTestId('target');

    fireEvent(target, 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    fireEvent(target, 'accessibilityAction', {
      nativeEvent: { actionName: 'longpress' },
    });

    expect({
      actions: target.props.accessibilityActions,
      longPresses: onLongPress.mock.calls.length,
      presses: onPress.mock.calls.length,
    }).toEqual({
      actions: [{ name: 'activate' }, { name: 'longpress' }],
      longPresses: 1,
      presses: 1,
    });
  });
});
