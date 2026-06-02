import { createRef } from 'react';
import { act, render } from '@testing-library/react-native';

const mockInjectJavaScript = jest.fn();
const mockWebViewProps: Record<string, unknown>[] = [];

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    WebView: React.forwardRef(
      (props: Record<string, unknown>, ref: unknown) => {
        mockWebViewProps.push(props);
        React.useImperativeHandle(ref, () => ({
          injectJavaScript: mockInjectJavaScript,
        }));
        return React.createElement(View, { testID: 'stream-webview' });
      },
    ),
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

import { StreamPlayer } from '../StreamPlayer';
import type { StreamPlayerRef } from '../types';

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
    jest.restoreAllMocks();
  });

  test('maps player bridge messages to callbacks and state updates', () => {
    const onContentGateChange = jest.fn();
    const onEnded = jest.fn();
    const onError = jest.fn();
    const onOffline = jest.fn();
    const onOnline = jest.fn();
    const onPause = jest.fn();
    const onPlaybackLatencyChange = jest.fn();
    const onPlay = jest.fn();
    const onReady = jest.fn();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <StreamPlayer
        autoplay={false}
        channel='cohhcarnage'
        height={200}
        muted
        onContentGateChange={onContentGateChange}
        onEnded={onEnded}
        onError={onError}
        onOffline={onOffline}
        onOnline={onOnline}
        onPause={onPause}
        onPlaybackLatencyChange={onPlaybackLatencyChange}
        onPlay={onPlay}
        onReady={onReady}
        showOverlayControls={false}
        width={300}
      />,
    );

    sendPlayerMessage('ready');
    sendPlayerMessage('play');
    sendPlayerMessage('playing');
    sendPlayerMessage('pause');
    sendPlayerMessage('ended');
    sendPlayerMessage('online');
    sendPlayerMessage('offline');
    sendPlayerMessage('contentGateDetected', { hasContentGate: true });
    sendPlayerMessage('playbackStats', { hlsLatencyBroadcaster: 3.4 });
    sendPlayerMessage('muteState', { muted: false, volume: 1 });
    sendPlayerMessage('error', { message: 'embed failed' });

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onOnline).toHaveBeenCalledTimes(1);
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onContentGateChange).toHaveBeenCalledWith(true);
    expect(onPlaybackLatencyChange).toHaveBeenCalledWith(3.4);
    expect(onError).toHaveBeenCalledWith('embed failed');
    expect(warnSpy).toHaveBeenCalledWith(
      '[StreamPlayer:embed ERROR]',
      'embed failed',
    );
  });

  test('resumes autoplay after a transient player pause', () => {
    jest.useFakeTimers();
    const onPause = jest.fn();

    render(
      <StreamPlayer
        channel='cohhcarnage'
        height={200}
        muted
        onPause={onPause}
        showOverlayControls={false}
        width={300}
      />,
    );

    sendPlayerMessage('pause');

    expect(onPause).not.toHaveBeenCalled();
    expect(mockInjectJavaScript).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(mockInjectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('window.playerControls.play()'),
    );
  });

  test('does not resume after an explicit native pause', () => {
    jest.useFakeTimers();
    const onPause = jest.fn();
    const playerRef = createRef<StreamPlayerRef>();

    render(
      <StreamPlayer
        ref={playerRef}
        channel='cohhcarnage'
        height={200}
        muted
        onPause={onPause}
        showOverlayControls={false}
        width={300}
      />,
    );

    act(() => {
      playerRef.current?.pause();
    });
    mockInjectJavaScript.mockClear();

    sendPlayerMessage('pause');
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(onPause).toHaveBeenCalledTimes(1);
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
  });

  test('remounts the WebView after Twitch auth completes', () => {
    jest.useFakeTimers();
    const onWebViewLoaded = jest.fn();

    render(
      <StreamPlayer
        channel='cohhcarnage'
        height={200}
        muted
        onWebViewLoaded={onWebViewLoaded}
        showOverlayControls={false}
        width={300}
      />,
    );

    const initialSource = latestWebViewProps().source;

    sendPlayerMessage('twitchAuthComplete');
    sendPlayerMessage('twitchAuthComplete');
    act(() => {
      jest.advanceTimersByTime(750);
    });

    expect(latestWebViewProps().source).toBe(initialSource);
    expect(mockWebViewProps.length).toBeGreaterThan(1);

    const propsAfterBridgeAuth = latestWebViewProps();
    act(() => {
      (
        propsAfterBridgeAuth.onNavigationStateChange as (event: {
          url: string;
        }) => void
      )({
        url: 'https://www.twitch.tv/passport-callback#access_token=abc',
      });
    });
    act(() => {
      jest.advanceTimersByTime(750);
    });

    const propsAfterNavigationAuth = latestWebViewProps();
    act(() => {
      (
        propsAfterNavigationAuth.onLoadEnd as (event: {
          nativeEvent: { url: string };
        }) => void
      )({
        nativeEvent: {
          url: 'https://www.twitch.tv/passport-callback#access_token=abc',
        },
      });
    });
    act(() => {
      jest.advanceTimersByTime(750);
    });

    expect(onWebViewLoaded).toHaveBeenCalledTimes(1);
    expect(mockWebViewProps.length).toBeGreaterThan(3);
  });

  test('uses the raw Twitch player URL with a Frosty-style control bootstrap', () => {
    const onWebViewLoaded = jest.fn();

    render(
      <StreamPlayer
        channel='cohhcarnage'
        height={200}
        muted={false}
        onWebViewLoaded={onWebViewLoaded}
        width={300}
      />,
    );

    expect(latestWebViewProps().source).toEqual({
      uri: 'https://player.twitch.tv/?channel=cohhcarnage&muted=false&parent=www.twitch.tv',
    });
    expect(latestWebViewProps()).toEqual(
      expect.objectContaining({
        injectedJavaScript: expect.stringContaining('.player-controls'),
      }),
    );
    expect(latestWebViewProps()).toEqual(
      expect.objectContaining({
        injectedJavaScript: expect.stringContaining('window.playerControls'),
      }),
    );
    expect(latestWebViewProps()).toEqual(
      expect.objectContaining({
        injectedJavaScript: expect.stringContaining(
          "video.setAttribute('playsinline', '')",
        ),
      }),
    );
    expect(latestWebViewProps()).toEqual(
      expect.objectContaining({
        injectedJavaScript: expect.stringContaining(
          'var shouldAutoplay = true',
        ),
      }),
    );
    expect(latestWebViewProps()).toEqual(
      expect.objectContaining({
        injectedJavaScript: expect.stringContaining(
          "window.addEventListener('orientationchange', schedulePlaybackRecovery)",
        ),
      }),
    );
    expect(latestWebViewProps()).toEqual(
      expect.objectContaining({
        injectedJavaScript: expect.stringContaining(
          "style.id = 'foam-twitch-control-hide-style'",
        ),
      }),
    );

    const { onLoadEnd } = latestWebViewProps();
    act(() => {
      (onLoadEnd as (event: { nativeEvent: { url: string } }) => void)({
        nativeEvent: {
          url: 'https://player.twitch.tv/?channel=cohhcarnage&muted=false&parent=www.twitch.tv',
        },
      });
    });

    expect(onWebViewLoaded).toHaveBeenCalledTimes(1);
    expect(latestWebViewProps()).toEqual(
      expect.not.objectContaining({
        injectedJavaScriptBeforeContentLoaded: expect.anything(),
      }),
    );
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
  });

  test('uses the Twitch clip embed URL for clips', () => {
    const onWebViewLoaded = jest.fn();

    render(
      <StreamPlayer
        clip='AnimatedOptimisticWasabiVoteNay'
        height={200}
        muted={false}
        onWebViewLoaded={onWebViewLoaded}
        width={300}
      />,
    );

    expect(latestWebViewProps().source).toEqual({
      uri: 'https://clips.twitch.tv/embed?clip=AnimatedOptimisticWasabiVoteNay&parent=www.twitch.tv&autoplay=true&muted=false&preload=metadata',
    });

    const { onLoadEnd } = latestWebViewProps();
    act(() => {
      (onLoadEnd as (event: { nativeEvent: { url: string } }) => void)({
        nativeEvent: {
          url: 'https://clips.twitch.tv/embed?clip=AnimatedOptimisticWasabiVoteNay&parent=www.twitch.tv&autoplay=true&muted=false&preload=metadata',
        },
      });
    });

    expect(onWebViewLoaded).toHaveBeenCalledTimes(1);
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
  });

  test('keeps external auth windows inside the current WebView', () => {
    render(
      <StreamPlayer
        channel='cohhcarnage'
        height={200}
        muted
        showOverlayControls={false}
        width={300}
      />,
    );

    expect(latestWebViewProps()).toEqual(
      expect.objectContaining({
        setSupportMultipleWindows: false,
      }),
    );
    expect(latestWebViewProps()).toEqual(
      expect.not.objectContaining({
        onOpenWindow: expect.anything(),
      }),
    );
  });

  test('blocks app navigation while allowing iframe navigation', () => {
    render(
      <StreamPlayer
        channel='cohhcarnage'
        height={200}
        muted
        restrictWebViewNavigationToTwitchPlayer
        showOverlayControls={false}
        width={300}
      />,
    );

    const { onShouldStartLoadWithRequest } = latestWebViewProps();

    expect(
      (
        onShouldStartLoadWithRequest as (request: {
          isTopFrame?: boolean;
          url: string;
        }) => boolean
      )({ url: 'foam://stream/cohhcarnage' }),
    ).toBe(false);
    expect(
      (
        onShouldStartLoadWithRequest as (request: {
          isTopFrame?: boolean;
          url: string;
        }) => boolean
      )({
        isTopFrame: false,
        url: 'https://evil.example/frame',
      }),
    ).toBe(true);
    expect(
      (
        onShouldStartLoadWithRequest as (request: {
          isTopFrame?: boolean;
          url: string;
        }) => boolean
      )({
        isTopFrame: true,
        url: 'https://evil.example/top',
      }),
    ).toBe(false);
  });
});
