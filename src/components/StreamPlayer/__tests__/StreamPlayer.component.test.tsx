import { act, render } from '@testing-library/react-native';

const mockInjectJavaScript = jest.fn();
const mockWebViewProps: Array<Record<string, unknown>> = [];

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    WebView: React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      mockWebViewProps.push(props);
      React.useImperativeHandle(ref, () => ({
        injectJavaScript: mockInjectJavaScript,
      }));
      return React.createElement(View, { testID: 'stream-webview' });
    }),
  };
});

jest.mock('@app/lib/haptics', () => ({
  impact: jest.fn(),
}));

jest.mock('@app/lib/sentry', () => ({
  countMetric: jest.fn(),
  recordError: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  }),
}));

jest.mock('../WebViewWarmupPool', () => ({
  streamWebViewWarmupPool: {
    getWarmupRenderProps: jest.fn(() => null),
    startWarmup: jest.fn(),
  },
}));

import { StreamPlayer } from '../StreamPlayer';

function latestWebViewProps() {
  const props = mockWebViewProps.at(-1);
  if (!props) {
    throw new Error('WebView was not rendered');
  }
  return props;
}

function sendPlayerMessage(type: string, payload: unknown = {}) {
  const props = latestWebViewProps();
  act(() => {
    (props.onMessage as (event: { nativeEvent: { data: string } }) => void)({
      nativeEvent: {
        data: JSON.stringify({ type, payload }),
      },
    });
  });
}

describe('StreamPlayer component messaging', () => {
  beforeEach(() => {
    mockInjectJavaScript.mockClear();
    mockWebViewProps.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('maps player bridge messages to callbacks and state updates', () => {
    const onContentGateChange = jest.fn();
    const onError = jest.fn();
    const onPause = jest.fn();
    const onPlaybackLatencyChange = jest.fn();
    const onPlay = jest.fn();
    const onReady = jest.fn();

    render(
      <StreamPlayer
        channel="cohhcarnage"
        height={200}
        muted
        onContentGateChange={onContentGateChange}
        onError={onError}
        onPause={onPause}
        onPlaybackLatencyChange={onPlaybackLatencyChange}
        onPlay={onPlay}
        onReady={onReady}
        showOverlayControls={false}
        width={300}
      />,
    );

    sendPlayerMessage('ready');
    sendPlayerMessage('playing');
    sendPlayerMessage('pause');
    sendPlayerMessage('contentGateDetected', { hasContentGate: true });
    sendPlayerMessage('playbackStats', { hlsLatencyBroadcaster: 3.4 });
    sendPlayerMessage('muteState', { muted: false, volume: 1 });
    sendPlayerMessage('error', { message: 'embed failed' });

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onContentGateChange).toHaveBeenCalledWith(true);
    expect(onPlaybackLatencyChange).toHaveBeenCalledWith(3.4);
    expect(onError).toHaveBeenCalledWith('embed failed');
  });

  test('remounts the WebView after Twitch auth completes', () => {
    jest.useFakeTimers();

    render(
      <StreamPlayer
        channel="cohhcarnage"
        height={200}
        muted
        showOverlayControls={false}
        width={300}
      />,
    );

    const initialSource = latestWebViewProps().source;

    sendPlayerMessage('twitchAuthComplete');
    act(() => {
      jest.advanceTimersByTime(750);
    });

    expect(latestWebViewProps().source).toBe(initialSource);
    expect(mockWebViewProps.length).toBeGreaterThan(1);
  });

  test('blocks app navigation while allowing iframe navigation', () => {
    render(
      <StreamPlayer
        channel="cohhcarnage"
        height={200}
        muted
        restrictWebViewNavigationToTwitchPlayer
        showOverlayControls={false}
        width={300}
      />,
    );

    const { onShouldStartLoadWithRequest } = latestWebViewProps();

    expect(
      (onShouldStartLoadWithRequest as (request: {
        isTopFrame?: boolean;
        url: string;
      }) => boolean)({ url: 'foam://stream/cohhcarnage' }),
    ).toBe(false);
    expect(
      (onShouldStartLoadWithRequest as (request: {
        isTopFrame?: boolean;
        url: string;
      }) => boolean)({
        isTopFrame: false,
        url: 'https://evil.example/frame',
      }),
    ).toBe(true);
    expect(
      (onShouldStartLoadWithRequest as (request: {
        isTopFrame?: boolean;
        url: string;
      }) => boolean)({
        isTopFrame: true,
        url: 'https://evil.example/top',
      }),
    ).toBe(false);
  });
});
