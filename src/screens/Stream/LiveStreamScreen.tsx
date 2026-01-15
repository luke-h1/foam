import { Chat } from '@app/components/Chat';
import { Icon } from '@app/components/Icon';
import { PressableArea } from '@app/components/PressableArea';
import { Spinner } from '@app/components/Spinner';
import { useAuthContext } from '@app/context/AuthContext';
import { StreamStackScreenProps } from '@app/navigators/StreamStackNavigator';
import { twitchQueries } from '@app/queries/twitchQueries';
import { useQueries } from '@tanstack/react-query';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

interface PlayerMessage {
  type: 'ready' | 'playing' | 'paused' | 'ended' | 'state';
  data: {
    isReady?: boolean;
    isPlaying?: boolean;
    isMuted?: boolean;
    volume?: number;
    // Debug diagnostic fields
    videoFound?: boolean;
    videoWidth?: number;
    videoHeight?: number;
    videoReadyState?: number;
    videoPaused?: boolean;
    videoCurrentTime?: number;
    rectWidth?: number;
    rectHeight?: number;
    rectTop?: number;
    rectLeft?: number;
    styleDisplay?: string;
    styleVisibility?: string;
    styleOpacity?: string;
    styleZIndex?: string;
    stylePosition?: string;
    parentRectWidth?: number;
    parentRectHeight?: number;
    documentWidth?: number;
    documentHeight?: number;
    // Mature content debug
    buttonCount?: number;
    overlayCount?: number;
    buttonTargets?: string[];
    overlayClasses?: string[];
    selector?: string;
    buttonText?: string;
    // Cookie inject debug
    cookieSet?: boolean;
    tokenLength?: number;
    currentCookies?: string;
  };
}

interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isReady: boolean;
}

// Lightweight JavaScript for player control - optimized for performance
const PLAYER_INJECT_JS = `
(function() {
  // Auto-accept content warning (Frosty approach) - runs once
  var warningInterval = setInterval(function() {
    var btn = document.querySelector('button[data-a-target*="content-classification-gate"]');
    if (btn) { btn.click(); clearInterval(warningInterval); }
  }, 500);
  setTimeout(function() { clearInterval(warningInterval); }, 15000);

  // Video element reference (cached for performance)
  var video = null;
  var getVideo = function() { return video || (video = document.querySelector('video')); };
  
  // Minimal state reporting
  var sendState = function() {
    var v = getVideo();
    if (v && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'state', data: { isPlaying: !v.paused, isMuted: v.muted, volume: v.volume }
      }));
    }
  };
  
  // Setup video once found
  var setupInterval = setInterval(function() {
    var v = getVideo();
    if (v) {
      clearInterval(setupInterval);
      v.muted = false;
      v.volume = 1.0;
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready', data: { isReady: true } }));
      }
      v.onplay = function() {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'playing', data: { isPlaying: true } }));
      };
      v.onpause = function() {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'paused', data: { isPlaying: false } }));
      };
      sendState();
    }
  }, 500);
  setTimeout(function() { clearInterval(setupInterval); }, 30000);
  
  // Command handler
  window.handleCommand = function(c, p) {
    var v = getVideo();
    if (!v) return;
    switch(c) {
      case 'play': v.play(); break;
      case 'pause': v.pause(); break;
      case 'togglePlay': v.paused ? v.play() : v.pause(); break;
      case 'mute': v.muted = true; break;
      case 'unmute': v.muted = false; break;
      case 'toggleMute': v.muted = !v.muted; break;
      case 'setVolume': v.volume = p.volume; break;
      case 'getState': sendState(); break;
    }
  };
})();
true;
`;

export const LiveStreamScreen: FC<StreamStackScreenProps<'LiveStream'>> = ({
  route: { params },
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  // Auth context kept for future use if needed
  useAuthContext();

  const [isChatVisible] = useState<boolean>(true);
  const [shouldRenderChat, setShouldRenderChat] = useState<boolean>(false);
  // Start with controls hidden so users can interact with Twitch UI initially
  const [controlsVisible, setControlsVisible] = useState<boolean>(false);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isMuted: false,
    volume: 1,
    isReady: false,
  });

  const webViewRef = useRef<WebView>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Frosty-style: No cookie setup needed - content warnings are auto-accepted via JavaScript

  const sendCommand = useCallback(
    (command: string, payload?: Record<string, unknown>) => {
      const js = `window.handleCommand('${command}', ${JSON.stringify(payload || {})});`;
      webViewRef.current?.injectJavaScript(js);
    },
    [],
  );

  // Optimized message handler - minimal processing for performance
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const { type, data } = JSON.parse(event.nativeEvent.data) as PlayerMessage;
      switch (type) {
        case 'ready':
          setPlayerState(prev => ({ ...prev, isReady: true }));
          break;
        case 'playing':
          setPlayerState(prev => ({ ...prev, isPlaying: true }));
          break;
        case 'paused':
        case 'ended':
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
          break;
        case 'state':
          setPlayerState(prev => ({
            ...prev,
            isPlaying: data.isPlaying ?? false,
            isMuted: data.isMuted ?? false,
            volume: data.volume ?? 1,
          }));
          break;
        // Ignore debug messages for performance
        default:
          break;
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playerState.isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [playerState.isPlaying]);

  const handleOverlayPress = useCallback(() => {
    if (controlsVisible) {
      sendCommand('togglePlay');
    }
    showControls();
  }, [controlsVisible, sendCommand, showControls]);

  useEffect(() => {
    setShouldRenderChat(false);
    return () => {
      setShouldRenderChat(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [params.id]);

  const [streamQueryResult] = useQueries({
    queries: [
      twitchQueries.getStream(params.id),
      twitchQueries.getUser(params.id),
      twitchQueries.getUserImage(params.id),
    ],
  });

  const { data: stream, isPending: isStreamPending } = streamQueryResult;

  useEffect(() => {
    if (stream?.user_login && stream?.user_id && !shouldRenderChat) {
      // Use setTimeout to defer Chat rendering to next tick, allowing screen to render first to stop blocking navigation
      const timer = setTimeout(() => {
        setShouldRenderChat(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [stream?.user_login, stream?.user_id, shouldRenderChat]);

  const getVideoDimensions = useCallback(() => {
    if (isLandscape) {
      return {
        width: isChatVisible ? screenWidth * 0.6 : screenWidth,
        height: screenHeight,
      };
    }
    return {
      width: screenWidth,
      height: screenWidth * (9 / 16),
    };
  }, [isLandscape, isChatVisible, screenWidth, screenHeight]);

  const getChatDimensions = useCallback(() => {
    if (isLandscape) {
      return {
        width: screenWidth * 0.65,
        height: screenHeight,
      };
    }
    const videoHeight = screenWidth * (9 / 16);
    return {
      width: screenWidth,
      height: screenHeight - videoHeight,
    };
  }, [isLandscape, screenWidth, screenHeight]);

  const videoWidth = useSharedValue(getVideoDimensions().width);
  const videoHeight = useSharedValue(getVideoDimensions().height);
  const chatWidth = useSharedValue(getChatDimensions().width);
  const chatHeight = useSharedValue(getChatDimensions().height);
  const chatOpacity = useSharedValue(1);
  const chatTranslateX = useSharedValue(0);

  useEffect(() => {
    const videoDims = getVideoDimensions();
    const chatDims = getChatDimensions();

    videoWidth.value = withTiming(videoDims.width, { duration: 300 });
    videoHeight.value = withTiming(videoDims.height, { duration: 300 });
    chatWidth.value = withTiming(chatDims.width, { duration: 300 });
    chatHeight.value = withTiming(chatDims.height, { duration: 300 });

    if (isChatVisible) {
      chatOpacity.value = withTiming(1, { duration: 300 });
      chatTranslateX.value = withTiming(0, { duration: 300 });
    } else {
      chatOpacity.value = withTiming(0, { duration: 300 });
      if (isLandscape) {
        chatTranslateX.value = withTiming(chatDims.width, { duration: 300 });
      }
    }
  }, [
    isLandscape,
    isChatVisible,
    screenWidth,
    screenHeight,
    videoWidth,
    videoHeight,
    chatWidth,
    chatHeight,
    chatOpacity,
    chatTranslateX,
    getVideoDimensions,
    getChatDimensions,
  ]);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    width: videoWidth.value,
    height: videoHeight.value,
  }));

  const animatedChatStyle = useAnimatedStyle(() => ({
    width: chatWidth.value,
    height: chatHeight.value,
    opacity: chatOpacity.value,
    transform: [{ translateX: chatTranslateX.value }],
  }));

  // Build the Twitch player URL - Frosty style with custom parent
  // Using parent=foam like Frosty uses parent=frosty
  const playerUrl = stream?.user_login
    ? `https://player.twitch.tv/?channel=${stream.user_login}&muted=false&parent=foam`
    : '';

  if (isStreamPending) {
    return <Spinner />;
  }

  return (
    <View style={[styles.contentContainer, isLandscape && styles.row]}>
      <Animated.View
        style={[styles.videoContainer, animatedVideoStyle]}
        renderToHardwareTextureAndroid
      >
        <WebView
          ref={webViewRef}
          source={{ uri: playerUrl }}
          style={styles.webView}
          originWhitelist={['*']}
          // Media playback settings - critical for video performance
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          allowsProtectedMedia
          // JavaScript and storage
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          // Cookie settings
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          // Performance optimizations
          androidLayerType="hardware"
          overScrollMode="never"
          scrollEnabled={false}
          bounces={false}
          mixedContentMode="always"
          // Disable features that can cause lag
          startInLoadingState={false}
          allowsBackForwardNavigationGestures={false}
          setSupportMultipleWindows={false}
          nestedScrollEnabled={false}
          textZoom={100}
          // iOS specific optimizations
          decelerationRate="normal"
          contentMode="mobile"
          automaticallyAdjustContentInsets={false}
          // Minimal event handlers for performance
          onMessage={handleMessage}
          injectedJavaScript={PLAYER_INJECT_JS}
        />
        {/* Controls overlay - only rendered when visible to allow WebView interaction */}
        {/* This allows users to click "Start Watching" on mature content warnings */}
        {controlsVisible && (
          <View style={styles.controlsOverlay} pointerEvents="box-none">
            <PressableArea
              style={styles.controlsTouchArea}
              onPress={handleOverlayPress}
            >
              <View style={styles.controlsContainer}>
                <PressableArea
                  style={styles.playButton}
                  onPress={() => sendCommand('togglePlay')}
                >
                  <Icon
                    icon={playerState.isPlaying ? 'pause' : 'play'}
                    iconFamily="Ionicons"
                    size={40}
                    color="#fff"
                  />
                </PressableArea>
                <PressableArea
                  style={styles.muteButton}
                  onPress={() => sendCommand('toggleMute')}
                >
                  <Icon
                    icon={playerState.isMuted ? 'volume-mute' : 'volume-high'}
                    iconFamily="Ionicons"
                    size={20}
                    color="#fff"
                  />
                </PressableArea>
              </View>
            </PressableArea>
          </View>
        )}
      </Animated.View>

      {(isChatVisible || chatOpacity.value > 0) && (
        <Animated.View style={[styles.chatContainer, animatedChatStyle]}>
          {shouldRenderChat && stream?.user_login && stream.user_id && (
            <View style={styles.chatContent}>
              <Chat
                channelId={stream.user_id}
                channelName={stream.user_login}
              />
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  contentContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  videoContainer: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  controlsTouchArea: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    overflow: 'hidden',
  },
  chatContent: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
}));
