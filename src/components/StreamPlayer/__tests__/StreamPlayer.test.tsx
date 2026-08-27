import { createRef, useImperativeHandle } from 'react';
import { AppState, InteractionManager, StyleSheet } from 'react-native';
import type { Ref } from 'react';
import type { AppStateStatus, ViewStyle } from 'react-native';
// Spy on the submodule: the barrel re-exports via `export *`, whose Babel
// getter is non-configurable, so jest.spyOn on the barrel throws.
import * as SafeAreaContext from 'react-native-safe-area-context/src/SafeAreaContext';
import type { WebViewNavigation, WebViewProps } from 'react-native-webview';
import * as RNWebView from 'react-native-webview';

import { act, render } from '@testing-library/react-native';

import type { LogMetadata } from '@app/lib/sentry';
import * as sentry from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

const mockInjectJavaScript = jest.fn();
const mockWebViewProps: WebViewProps[] = [];

interface MockWebViewHandle {
  injectJavaScript: (script: string) => void;
}

/**
 * `jest.restoreAllMocks()` in `afterEach` also reverts module-scope spies,
 * so reinstall these fresh before every test.
 */
function installModuleSpies() {
  // Swap the native WebView for a View that captures props/ref; untyped
  // requireActual dodges WebView's class-instance render signature.
  jest.spyOn(RNWebView, 'WebView').mockImplementation(rawProps => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- untyped requireActual dodges WebView's class-instance render signature.
    const ReactActual = jest.requireActual('react');
    const { View: RNView } = jest.requireActual('react-native');
    // SAFETY: the mocked component only ever receives WebViewProps plus a ref.
    const { ref, ...props } = rawProps as WebViewProps & {
      ref?: Ref<MockWebViewHandle>;
    };
    mockWebViewProps.push(props);
    useImperativeHandle(ref, () => ({
      injectJavaScript: mockInjectJavaScript,
    }));
    return ReactActual.createElement(RNView, { testID: 'stream-webview' });
  });

  // StreamPlayer defers WebView mount until interactions settle; run the
  // callback synchronously so tests can read WebView props right after render.
  jest
    .spyOn(InteractionManager, 'runAfterInteractions')
    .mockImplementation(task => {
      // SAFETY: this codebase only ever passes a plain callback to runAfterInteractions, never a SimpleTask/PromiseTask.
      (task as (() => void) | undefined)?.();
      return {
        then: () => Promise.resolve(),
        done: () => undefined,
        cancel: jest.fn(),
      };
    });

  jest.spyOn(sentry, 'countMetric').mockImplementation(() => {});
  jest.spyOn(sentry, 'endSpan').mockImplementation(() => {});
  jest.spyOn(sentry, 'forwardLogToSentry').mockImplementation(() => {});
  jest.spyOn(sentry, 'startInactiveSpan').mockImplementation(() => undefined);

  jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  });
}

import { StreamPlayer } from '../StreamPlayer';
import type { PlayerMessage, StreamPlayerRef } from '../types';

function latestWebViewProps() {
  const props = mockWebViewProps.at(-1);
  if (!props) {
    throw new Error('WebView was not rendered');
  }
  return props;
}

function sendPlayerMessage(message: PlayerMessage) {
  const props = latestWebViewProps();
  act(() => {
    // SAFETY: the player bridge's onMessage only reads event.nativeEvent.data.
    (props.onMessage as (event: { nativeEvent: { data: string } }) => void)({
      nativeEvent: {
        data: JSON.stringify(message),
      },
    });
  });
}

function webViewNavigation(url: string): WebViewNavigation {
  return {
    canGoBack: false,
    canGoForward: false,
    loading: false,
    lockIdentifier: 0,
    navigationType: 'other',
    title: '',
    url,
  };
}

function emitWebViewLoadEnd(url: string) {
  const { onLoadEnd } = latestWebViewProps();
  act(() => {
    // SAFETY: StreamPlayerWebView's onLoadEnd only reads event.nativeEvent.url.
    (onLoadEnd as (event: { nativeEvent: { url: string } }) => void)({
      nativeEvent: { url },
    });
  });
}

function emitWebViewNavigationStateChange(url: string) {
  const { onNavigationStateChange } = latestWebViewProps();
  if (!onNavigationStateChange) {
    throw new Error('WebView was rendered without onNavigationStateChange');
  }
  act(() => {
    onNavigationStateChange(webViewNavigation(url));
  });
}

type RenderedTree = ReturnType<ReturnType<typeof render>['toJSON']>;

/**
 * The layout nudge that forces WKWebView to rebuild its layer tree shows up as
 * a 1px `paddingBottom` on the player container (the render root).
 */
function containerPaddingBottom(tree: RenderedTree) {
  if (!tree || Array.isArray(tree)) {
    throw new Error('expected a single player container element');
  }
  const style: ViewStyle = StyleSheet.flatten(tree.props.style);
  return style.paddingBottom;
}

describe('StreamPlayer component messaging', () => {
  let emitAppState: (nextState: AppStateStatus) => void;

  beforeEach(() => {
    installModuleSpies();
    mockInjectJavaScript.mockClear();
    mockWebViewProps.length = 0;
    emitAppState = () => {
      throw new Error('no AppState change handler registered');
    };
    AppState.currentState = 'active';
    jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, handler) => {
        emitAppState = handler;
        return { remove: jest.fn() };
      });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // Playback start pulses the layout nudge on a timer; without fake timers the
  // pulse lands after the test ends and warns about an unwrapped state update.
  test('maps player bridge messages to callbacks and state updates', () => {
    jest.useFakeTimers();
    const onContentGateChange = jest.fn();
    const onEnded = jest.fn();
    const onError = jest.fn();
    const onOffline = jest.fn();
    const onOnline = jest.fn();
    const onPause = jest.fn();
    const onPlaybackLatencyChange = jest.fn();
    const onPlay = jest.fn();
    const onReady = jest.fn();
    const warnSpy = jest.spyOn(logger.main, 'error').mockImplementation();

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

    sendPlayerMessage({ type: 'ready' });
    sendPlayerMessage({ type: 'error', payload: { message: 'embed failed' } });
    sendPlayerMessage({ type: 'play' });
    sendPlayerMessage({ type: 'playing' });
    sendPlayerMessage({ type: 'pause' });
    sendPlayerMessage({ type: 'ended' });
    sendPlayerMessage({ type: 'online' });
    sendPlayerMessage({ type: 'offline' });
    sendPlayerMessage({
      type: 'contentGateDetected',
      payload: { hasContentGate: true },
    });
    sendPlayerMessage({
      type: 'playbackStats',
      payload: { hlsLatencyBroadcaster: 3.4 },
    });
    sendPlayerMessage({
      type: 'muteState',
      payload: { muted: false, volume: 1 },
    });

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(onOnline).toHaveBeenCalledTimes(1);
    expect(onOffline).toHaveBeenCalledTimes(1);
    expect(onContentGateChange).toHaveBeenCalledWith(true);
    expect(onPlaybackLatencyChange).toHaveBeenCalledWith(3.4);
    expect(onError).toHaveBeenCalledWith('embed failed');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    // SAFETY: StreamPlayer logs embed errors through the LogMetadata overload of logger.main.error; jest.spyOn erases that overload to unknown[].
    const embedErrorMetadata = warnSpy.mock.calls[0]?.[1] as
      LogMetadata | undefined;
    expect(warnSpy.mock.calls[0]?.[0]).toBe(
      '[StreamPlayer:embed ERROR] embed failed',
    );
    expect(embedErrorMetadata).toEqual<LogMetadata>({
      name: 'twitch_player_error',
      exceptionName: 'StreamPlayerEmbedError',
      fingerprint: ['stream-player-embed-error'],
      channel: 'cohhcarnage',
      message: 'embed failed',
      elapsedMs: embedErrorMetadata?.elapsedMs,
      autoplay: false,
      content_kind: 'live',
      elapsed_ms: embedErrorMetadata?.elapsed_ms,
      outcome: 'failed',
      reason: 'embed_error',
    });
    expect(embedErrorMetadata?.elapsedMs).toEqual(expect.any(Number));
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

    sendPlayerMessage({ type: 'pause' });

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

    sendPlayerMessage({ type: 'pause' });
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

    sendPlayerMessage({ type: 'twitchAuthComplete' });
    sendPlayerMessage({ type: 'twitchAuthComplete' });
    act(() => {
      jest.advanceTimersByTime(750);
    });

    expect(latestWebViewProps().source).toStrictEqual(initialSource);
    expect(mockWebViewProps.length).toBeGreaterThan(1);

    emitWebViewNavigationStateChange(
      'https://www.twitch.tv/passport-callback#access_token=abc',
    );
    act(() => {
      jest.advanceTimersByTime(750);
    });

    emitWebViewLoadEnd(
      'https://www.twitch.tv/passport-callback#access_token=abc',
    );
    act(() => {
      jest.advanceTimersByTime(750);
    });

    expect(onWebViewLoaded).toHaveBeenCalledTimes(1);
    expect(mockWebViewProps.length).toBeGreaterThan(3);
  });

  test('loads the stock raw Twitch player URL without the control bootstrap', () => {
    jest.useFakeTimers();
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
    const { injectedJavaScript } = latestWebViewProps();
    if (injectedJavaScript === undefined) {
      throw new Error('Expected injectedJavaScript to be a string');
    }
    expect(injectedJavaScript.includes('twitchAuthComplete')).toEqual(true);
    expect(injectedJavaScript.includes('window.playerControls')).toEqual(false);
    expect(
      injectedJavaScript.includes('foam-twitch-control-hide-style'),
    ).toEqual(false);
    // Autoplaying live: nudge the stock player into unmuted playback.
    expect(
      injectedJavaScript.includes('__foamAutoplayEnsureInstalled'),
    ).toEqual(true);

    emitWebViewLoadEnd(
      'https://player.twitch.tv/?channel=cohhcarnage&muted=false&parent=www.twitch.tv',
    );

    expect(onWebViewLoaded).toHaveBeenCalledTimes(1);
    const beforeContentScript =
      latestWebViewProps().injectedJavaScriptBeforeContentLoaded ?? '';
    expect(
      beforeContentScript.includes(
        "window.localStorage.getItem('video-quality')",
      ),
    ).toEqual(true);
    expect(beforeContentScript.includes('"720p60"')).toEqual(true);
    // On WebView-ready it kicks autoplay (not the control bootstrap).
    expect(mockInjectJavaScript).toHaveBeenCalledWith(
      expect.stringContaining('window.__foamEnsurePlaying'),
    );
  });

  test('uses the Twitch clip embed URL for clips', () => {
    jest.useFakeTimers();
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
    const clipInjectedJavaScript =
      latestWebViewProps().injectedJavaScript ?? '';
    expect(
      clipInjectedJavaScript.includes('__foamAutoplayEnsureInstalled'),
    ).toEqual(false);

    emitWebViewLoadEnd(
      'https://clips.twitch.tv/embed?clip=AnimatedOptimisticWasabiVoteNay&parent=www.twitch.tv&autoplay=true&muted=false&preload=metadata',
    );

    expect(onWebViewLoaded).toHaveBeenCalledTimes(1);
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
  });

  test('pulses the player frame again when the app returns to the foreground', () => {
    jest.useFakeTimers();

    const { toJSON } = render(
      <StreamPlayer
        channel='cohhcarnage'
        height={200}
        muted
        showOverlayControls={false}
        width={300}
      />,
    );

    // The mount-time nudge fires off WebView load-end and is once-per-generation.
    emitWebViewLoadEnd('https://player.twitch.tv/?channel=cohhcarnage');
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(containerPaddingBottom(toJSON())).toEqual(undefined);

    act(() => {
      emitAppState('background');
      emitAppState('active');
      jest.advanceTimersByTime(0);
    });

    expect(containerPaddingBottom(toJSON())).toEqual(1);

    // Drains both foreground pulses back to a resting frame.
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(containerPaddingBottom(toJSON())).toEqual(undefined);
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

    expect(latestWebViewProps().setSupportMultipleWindows).toEqual(false);
    expect(latestWebViewProps().onOpenWindow).toEqual(undefined);
  });

  test('blocks only the app deep-link scheme, allowing all web navigation', () => {
    render(
      <StreamPlayer
        channel='cohhcarnage'
        height={200}
        muted
        showOverlayControls={false}
        width={300}
      />,
    );

    const { onShouldStartLoadWithRequest } = latestWebViewProps();
    if (!onShouldStartLoadWithRequest) {
      throw new Error(
        'WebView was rendered without onShouldStartLoadWithRequest',
      );
    }
    const shouldStart = (url: string, isTopFrame = false) =>
      onShouldStartLoadWithRequest({ ...webViewNavigation(url), isTopFrame });

    expect(shouldStart('foam://stream/cohhcarnage')).toBe(false);
    expect(shouldStart('exp+foam://stream/cohhcarnage')).toBe(false);
    expect(shouldStart('https://www.twitch.tv/cohhcarnage', true)).toBe(true);
    expect(shouldStart('https://id.twitch.tv/oauth2', true)).toBe(true);
    expect(shouldStart('https://evil.example/frame', false)).toBe(true);
  });
});
