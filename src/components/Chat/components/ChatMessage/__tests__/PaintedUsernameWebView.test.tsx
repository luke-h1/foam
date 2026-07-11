import { StyleSheet } from 'react-native';

import { act, render, screen } from '@testing-library/react-native';

import type { PaintData } from '@app/types/seventv/cosmetics';

import { PaintedUsernameWebView } from '../CosmeticUsername/PaintedUsernameWebView';
import { chatLineMetrics } from '../RichChatMessage.styles';

jest.mock('react-native-webview', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    WebView: (props: object) =>
      React.createElement(View, { testID: 'painted-webview', ...props }),
  };
});

const paint: PaintData = {
  id: 'paint-1',
  name: 'Test Paint',
  color: null,
  layers: { length: 0 },
  shadows: { length: 0 },
  textStyle: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 90,
  shape: 'circle',
  image_url: '',
  stops: { length: 0 },
};

const sendSizeMessage = (width: number, height: number) => {
  const webView = screen.getByTestId('painted-webview');
  act(() => {
    webView.props.onMessage({
      nativeEvent: { data: JSON.stringify({ width, height }) },
    });
  });
};

describe('PaintedUsernameWebView', () => {
  test('sizes the layout from the fallback text sizer before the webview reports a size', () => {
    render(
      <PaintedUsernameWebView
        username='PaintUser'
        paint={paint}
        fallbackColor='#FF0000'
      />,
    );

    const sizerStyle = StyleSheet.flatten(
      screen.getByText('PaintUser').props.style,
    );
    expect({
      color: sizerStyle.color,
      fontSize: sizerStyle.fontSize,
      fontWeight: sizerStyle.fontWeight,
      lineHeight: sizerStyle.lineHeight,
    }).toEqual({
      color: '#FF0000',
      fontSize: chatLineMetrics.comfortable.fontSize,
      fontWeight: 'bold',
      lineHeight: chatLineMetrics.comfortable.lineHeight,
    });

    const containerStyle = StyleSheet.flatten(
      screen.getByTestId('painted-webview').props.containerStyle,
    );
    expect({
      opacity: containerStyle.opacity,
      position: containerStyle.position,
    }).toEqual({
      opacity: 0,
      position: 'absolute',
    });

    const rootStyle = StyleSheet.flatten(screen.root.props.style);
    expect({
      alignSelf: rootStyle.alignSelf,
      height: rootStyle.height,
      width: rootStyle.width,
    }).toEqual({
      alignSelf: 'flex-start',
      height: undefined,
      width: undefined,
    });
  });

  test('applies the measured size and reveals the webview after the sizing message', () => {
    render(
      <PaintedUsernameWebView
        username='PaintUser'
        paint={paint}
        fallbackColor='#FF0000'
      />,
    );

    sendSizeMessage(123.4, 21.2);

    expect(screen.queryByText('PaintUser')).not.toBeOnTheScreen();

    const rootStyle = StyleSheet.flatten(screen.root.props.style);
    expect({
      height: rootStyle.height,
      width: rootStyle.width,
    }).toEqual({
      height: 22,
      width: 124,
    });

    const containerStyle = StyleSheet.flatten(
      screen.getByTestId('painted-webview').props.containerStyle,
    );
    expect({
      opacity: containerStyle.opacity,
      position: containerStyle.position,
    }).toEqual({
      opacity: undefined,
      position: undefined,
    });
  });

  test('keeps the fallback sizer when the webview posts a malformed message', () => {
    render(
      <PaintedUsernameWebView
        username='PaintUser'
        paint={paint}
        fallbackColor='#FF0000'
      />,
    );

    const webView = screen.getByTestId('painted-webview');
    act(() => {
      webView.props.onMessage({ nativeEvent: { data: 'not json' } });
    });

    expect(screen.getByText('PaintUser')).toBeOnTheScreen();
  });
});
