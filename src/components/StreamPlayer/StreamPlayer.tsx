import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Text } from '@app/components/Text';
import { sentryService } from '@app/services/sentry-service';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  type AppStateStatus,
  type DimensionValue,
  Platform,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  WebViewError,
  WebViewHttpError,
} from 'react-native-webview/lib/WebViewTypes';
import { scheduleOnRN } from 'react-native-worklets';

export interface StreamPlayerRef {
  /**
   * Force refresh the player (hard reload)
   */
  forceRefresh: () => void;
  /**
   * Get the current channel name
   */
  getChannel: () => string | undefined;
  /**
   * Get the current playback time in seconds
   */
  getCurrentTime: () => Promise<number>;
  /**
   * Get the total duration in seconds (VODs only)
   */
  getDuration: () => Promise<number>;
  /**
   * Get the current muted state
   */
  getMuted: () => boolean;
  /**
   * Get the current paused state
   */
  getPaused: () => boolean;
  /**
   * Get the current volume (0-1)
   */
  getVolume: () => number;
  /**
   * Mute the player
   */
  mute: () => void;
  /**
   * Pause playback
   */
  pause: () => void;
  /**
   * Start or resume playback
   */
  play: () => void;
  /**
   * Seek to a specific timestamp in seconds (VODs only)
   */
  seek: (timestamp: number) => void;
  /**
   * Switch to a different channel
   */
  setChannel: (channel: string) => void;
  /**
   * Set the muted state
   */
  setMuted: (muted: boolean) => void;
  /**
   * Set the video quality
   */
  setQuality: (quality: string) => void;
  /**
   * Play a specific VOD
   * @param videoId - The VOD ID
   * @param timestamp - Optional start time in seconds
   */
  setVideo: (videoId: string, timestamp?: number) => void;
  /**
   * Set the volume level
   * @param volume - Volume level between 0 and 1
   */
  setVolume: (volume: number) => void;
  /**
   * Unmute the player
   */
  unmute: () => void;
}

export interface StreamInfo {
  /**
   * Game/category name being played
   */
  gameName?: string;
  /**
   * URL to the streamer's avatar image
   */
  profileImageUrl?: string;
  /**
   * Stream start time (ISO string) for calculating duration
   */
  startedAt?: string;
  /**
   * Stream title
   */
  title?: string;
  /**
   * Streamer's display name
   */
  userName?: string;
  /**
   * Streamer's login/username
   */
  userLogin?: string;
  /**
   * Current viewer count
   */
  viewerCount?: number;
}

export interface StreamPlayerProps {
  /**
   * Enable autoplay
   * @default true
   */
  autoplay?: boolean;
  /**
   * Twitch channel name
   */
  channel?: string;

  /**
   * Height of the player
   */
  height?: DimensionValue;

  /**
   * Initial muted state
   * @default false
   */
  muted?: boolean;
  /**
   * Callback when back button is pressed
   */
  onBackPress?: () => void;
  /**
   * Callback when the stream ends
   */
  onEnded?: () => void;
  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void;
  /**
   * Callback when the stream goes offline
   */
  onOffline?: () => void;
  /**
   * Callback when the stream goes online
   */
  onOnline?: () => void;
  /**
   * Callback when the stream pauses
   */
  onPause?: () => void;
  /**
   * Callback when the stream plays
   */
  onPlay?: () => void;
  /**
   * Callback when the player is ready
   */
  onReady?: () => void;
  /**
   * Callback when refresh is pressed
   */
  onRefresh?: () => void;
  /**
   * Parent domain for embed
   * @default 'foam-app.com'
   */
  parent?: string;
  /**
   * Show custom overlay controls
   * @default true
   */
  showOverlayControls?: boolean;
  /**
   * Stream information for the overlay
   */
  streamInfo?: StreamInfo;
  /**
   * VOD ID to play
   */
  video?: string;
  /**
   * Width of the player
   */
  width?: DimensionValue;
}

interface PlayerState {
  channel?: string;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  isPaused: boolean;
  isReady: boolean;
  muted: boolean;
  quality: string;
  volume: number;
}

type PlayerMessage =
  | { payload: { message: string }; type: 'error' }
  | { payload: { time: number }; type: 'currentTime' }
  | { payload: { duration: number }; type: 'duration' }
  | { payload: PlayerState; type: 'stateUpdate' }
  | {
      payload: {
        currentTime: number;
        networkState: number;
        paused: boolean;
        readyState: number;
      };
      type: 'healthCheck';
    }
  | { type: 'ended' }
  | { type: 'offline' }
  | { type: 'online' }
  | { type: 'pause' }
  | { type: 'play' }
  | { type: 'ready' };

function generatePlayerURL(options: {
  channel?: string;
  parent: string;
  video?: string;
}): string {
  const { channel, parent, video } = options;

  if (video) {
    return `https://player.twitch.tv/?video=${video}&parent=${parent}&muted=false`;
  }

  return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&muted=false`;
}

/**
 * Injected JS for player controls
 */
const INJECTED_JAVASCRIPT = `
(function() {
  // singleton
  if (window._injected) return;
  window._injected = true;

  console.log('[Foam] Injected JS starting...');

  function postMessage(type, payload) {
    try {
      console.log('[Foam] Posting message:', type, payload ? JSON.stringify(payload) : '');
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
    } catch (e) {
      console.error('[Foam] Failed to post message:', e);
    }
  }

  // Debug: Log all video events
  function debugVideoElement(video) {
    if (!video || video._debugAttached) return;
    video._debugAttached = true;

    var events = [
      'loadstart', 'progress', 'suspend', 'abort', 'error', 'emptied',
      'stalled', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough',
      'playing', 'waiting', 'seeking', 'seeked', 'ended', 'durationchange',
      'timeupdate', 'play', 'pause', 'ratechange', 'resize', 'volumechange'
    ];

    events.forEach(function(eventName) {
      video.addEventListener(eventName, function(e) {
        console.log('[Foam] Video event:', eventName,
          'paused:', video.paused,
          'readyState:', video.readyState,
          'networkState:', video.networkState,
          'currentTime:', video.currentTime ? video.currentTime.toFixed(2) : 0
        );
      });
    });
  }

  // Promise queue with length limit and generation tracking
  // Generation tracking prevents counter from going negative when queue resets
  window._PROMISE_QUEUE = Promise.resolve();
  window._promiseQueueLength = 0;
  window._promiseQueueGen = 0;

  window._queuePromise = function(method) {
    window._promiseQueueLength++;

    // Reset queue if it gets too long (prevents memory accumulation)
    if (window._promiseQueueLength > 30) {
      window._PROMISE_QUEUE = Promise.resolve();
      window._promiseQueueLength = 1;
      window._promiseQueueGen++;
    }

    var myGen = window._promiseQueueGen;

    window._PROMISE_QUEUE = window._PROMISE_QUEUE.then(function() {
      return new Promise(function(resolve) {
        Promise.resolve().then(function() {
          return method();
        }).then(function() {
          // Only decrement if still same generation (not reset)
          if (myGen === window._promiseQueueGen) {
            window._promiseQueueLength--;
          }
          resolve();
        }).catch(function(e) {
          console.warn('Queue promise error:', e);
          if (myGen === window._promiseQueueGen) {
            window._promiseQueueLength--;
          }
          resolve();
        });
      });
    });

    return window._PROMISE_QUEUE;
  };

  // Periodic cleanup timer - reset promise queue every 10 minutes
  // Prevents memory accumulation during extended viewing sessions
  // This is a soft reset that clears queue state without full page reload
  window._cleanupInterval = setInterval(function() {
    window._PROMISE_QUEUE = Promise.resolve();
    window._promiseQueueLength = 0;
    window._promiseQueueGen++;
  }, 600000); // 10 minutes

  // Async query selector that waits for element to appear
  window._asyncQuerySelector = function(selector, timeout) {
    timeout = timeout || 30000;
    return new Promise(function(resolve) {
      var element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }

      var timeoutId;
      var observer = new MutationObserver(function() {
        element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(element);
        }
      });
      // Must use subtree to detect nested elements in the player
      observer.observe(document.body, { childList: true, subtree: true });

      // Always set timeout with default of 30 seconds
      timeoutId = setTimeout(function() {
        observer.disconnect();
        resolve(undefined);
      }, timeout);
    });
  };

  // Accept content warning - handles mature content gates
  function acceptContentWarning() {
    console.log('[Foam] Checking for content warning gates...');

    // Comprehensive list of content gate selectors
    var selectors = [
      // Modern content classification gates
      'button[data-a-target*="content-classification-gate"]',
      '[data-a-target="content-classification-gate-overlay-start-watching-button"]',
      'button[data-a-target="player-overlay-content-gate-confirm-button"]',
      // Mature content gates
      'button[data-a-target="player-overlay-mature-accept"]',
      'button[data-a-target*="mature-accept"]',
      // Generic overlay buttons
      '[data-a-target*="overlay-start-watching"]',
      '[data-a-target*="overlay-confirm"]',
      // Text-based selectors (fallback)
      'button:has-text("Start Watching")',
      'button:has-text("Continue")',
      'button:has-text("Accept")',
      // Class-based selectors
      '.content-classification-gate button',
      '.player-overlay button[type="button"]',
    ];

    var attempts = 0;
    var maxAttempts = 20;
    var checkInterval = setInterval(function() {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(checkInterval);
        return;
      }

      selectors.forEach(function(selector) {
        try {
          var btn = document.querySelector(selector);
          if (!btn) {
            var buttons = document.querySelectorAll(selector);
            btn = buttons.length > 0 ? buttons[0] : null;
          }

          if (btn) {
            var rect = btn.getBoundingClientRect();
            var style = window.getComputedStyle(btn);

            if (rect.width > 0 && rect.height > 0 &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.pointerEvents !== 'none') {
              console.log('[Foam] Found and clicking content gate button:', selector);

              try {
                btn.click();
              } catch (e) {
                var clickEvent = new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  view: window
                });
                btn.dispatchEvent(clickEvent);
              }

              try {
                btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
              } catch (e) {
                // Ignore event dispatch errors
              }
            }
          }
        } catch (e) {
          // Ignore selector errors
        }
      });

      try {
        var allButtons = document.querySelectorAll('button');
        allButtons.forEach(function(btn) {
          var text = (btn.textContent || btn.innerText || '').toLowerCase();
          if (text.includes('start watching') ||
              text.includes('continue') ||
              text.includes('accept') ||
              text.includes('watch')) {
            var rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log('[Foam] Found text-based content gate button, clicking');
              try {
                btn.click();
              } catch (e) {
                // Ignore click errors
              }
            }
          }
        });
      } catch (e) {
        // Ignore button search errors
      }
    }, 500);

    // Use async query selector for initial detection
    selectors.forEach(function(selector) {
      _asyncQuerySelector(selector, 10000).then(function(btn) {
        if (btn) {
          console.log('[Foam] Found content gate button (async):', selector);
          try {
            btn.click();
            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          } catch (e) {
            console.warn('[Foam] Failed to click button:', e);
          }
        }
      });
    });
  }

  // Check for error states and offline messages
  function checkForErrors() {
    // Check for various error/offline indicators
    var errorSelectors = [
      '[data-a-target="player-overlay-content-gate"]',
      '.channel-status-info--offline',
      '.offline-recommendations',
      '[data-test-selector="video-player__video-error"]',
      '.video-player__error',
      '.player-error'
    ];

    errorSelectors.forEach(function(selector) {
      var el = document.querySelector(selector);
      if (el) {
        console.log('[Foam] Found error/offline element:', selector, el.textContent?.substring(0, 100));
        postMessage('error', { message: 'Stream error: ' + selector });
      }
    });

    // Check if there's any text indicating offline
    var bodyText = document.body?.innerText || '';
    if (bodyText.includes('is offline') || bodyText.includes('Channel is not live')) {
      console.log('[Foam] Stream appears to be offline');
      postMessage('offline');
    }
    
    var video = document.querySelector('video');
    if (!video && document.readyState === 'complete') {
      var hasPlayerContainer = document.querySelector('[data-a-target="player-container"]');
      if (hasPlayerContainer) {
        console.warn('[Foam] Player container exists but no video element - possible blank screen');
        acceptContentWarning();
      }
    }
  }

  // Hide Twitch's default overlay controls using CSS injection
  function hideDefaultOverlay() {
    if (!document.getElementById('foam-overlay-styles')) {
      var style = document.createElement('style');
      style.id = 'foam-overlay-styles';
      style.textContent =
        '.top-bar,' +
        '.player-controls,' +
        '#channel-player-disclosures,' +
        '[data-a-target="player-overlay-preview-background"],' +
        '[data-a-target="player-overlay-video-stats"]' +
        '{ display: none !important; visibility: hidden !important; pointer-events: none !important; }' +
        'body, html { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }' +
        '[data-a-target="player-container"], [data-a-target="player-container"] > div { ' +
        '  display: flex !important; ' +
        '  align-items: center !important; ' +
        '  justify-content: center !important; ' +
        '  width: 100% !important; ' +
        '  height: 100% !important; ' +
        '  margin: 0 !important; ' +
        '  padding: 0 !important; ' +
        '}' +
        'video { ' +
        '  display: block !important; ' +
        '  visibility: visible !important; ' +
        '  opacity: 1 !important; ' +
        '  max-width: 100% !important; ' +
        '  max-height: 100% !important; ' +
        '  width: auto !important; ' +
        '  height: auto !important; ' +
        '  object-fit: contain !important; ' +
        '  margin: 0 auto !important; ' +
        '}';
      document.head.appendChild(style);
    }

    var observer = new MutationObserver(function(mutations, obs) {
      if (document.querySelector('video')) {
        obs.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function() { observer.disconnect(); }, 30000);
  }

  // Configure video element for playback
  function configureVideoElement(videoElement) {
    if (!videoElement || videoElement._configured) return;
    videoElement._configured = true;

    // Disable text tracks (captions) immediately
    if (videoElement.textTracks) {
      for (var i = 0; i < videoElement.textTracks.length; i++) {
        videoElement.textTracks[i].mode = 'hidden';
      }
    }
  }

  // Initialize video player
  function initVideo() {
    console.log('[Foam] initVideo called, waiting for video element...');

    _queuePromise(function() {
      return _asyncQuerySelector('video').then(function(videoElement) {
        if (!videoElement) {
          console.warn('[Foam] Video element not found within timeout');
          postMessage('error', { message: 'Video element not found' });
          return;
        }

        // Check computed styles for visibility
        var computedStyle = window.getComputedStyle(videoElement);
        var visibilityData = {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          width: computedStyle.width,
          height: computedStyle.height,
          position: computedStyle.position,
          zIndex: computedStyle.zIndex
        };

        console.log('[Foam] Video element found!', {
          paused: videoElement.paused,
          muted: videoElement.muted,
          readyState: videoElement.readyState,
          networkState: videoElement.networkState,
          src: videoElement.src ? 'present' : 'missing',
          autoplay: videoElement.autoplay,
          dimensions: {
            videoWidth: videoElement.videoWidth,
            videoHeight: videoElement.videoHeight,
            clientWidth: videoElement.clientWidth,
            clientHeight: videoElement.clientHeight,
            offsetWidth: videoElement.offsetWidth,
            offsetHeight: videoElement.offsetHeight
          },
          styles: visibilityData
        });

        debugVideoElement(videoElement);

        configureVideoElement(videoElement);

        if (!videoElement._listenersAdded) {
          videoElement._listenersAdded = true;

          videoElement.addEventListener('pause', function() {
            postMessage('pause');
            // Hide captions on pause
            if (videoElement.textTracks && videoElement.textTracks.length > 0) {
              videoElement.textTracks[0].mode = 'hidden';
            }
          });

          videoElement.addEventListener('playing', function() {
            postMessage('play');
            // Ensure video is unmuted and at full volume
            videoElement.muted = false;
            videoElement.volume = 1.0;
            // Hide captions
            if (videoElement.textTracks && videoElement.textTracks.length > 0) {
              videoElement.textTracks[0].mode = 'hidden';
            }
          });

          videoElement.addEventListener('ended', function() {
            postMessage('ended');
          });

          var lastBufferingState = null;
          videoElement.addEventListener('waiting', function() {
            if (lastBufferingState !== true) {
              lastBufferingState = true;
              postMessage('stateUpdate', { isBuffering: true });
            }
          });

          videoElement.addEventListener('canplay', function() {
            if (lastBufferingState !== false) {
              lastBufferingState = false;
              postMessage('stateUpdate', { isBuffering: false });
            }
          });

          videoElement.addEventListener('loadedmetadata', function() {
            // Metadata loaded
          });

          var lastTimeCheck = -1;
          var timeCheckCount = 0;
          videoElement.addEventListener('timeupdate', function() {
            var currentTime = videoElement.currentTime;
            // Only log every 2 seconds to avoid spam
            if (Date.now() % 2000 < 100) {
              if (lastTimeCheck >= 0 && Math.abs(currentTime - lastTimeCheck) < 0.1 && !videoElement.paused) {
                timeCheckCount++;
                if (timeCheckCount >= 3) {
                  // Video appears stuck - recovery handled by checkPlaybackStuck
                }
              } else {
                timeCheckCount = 0;
              }
              lastTimeCheck = currentTime;
            }
          });
        }

        if (!videoElement.paused) {
          postMessage('play');
          videoElement.muted = false;
          videoElement.volume = 1.0;
          if (videoElement.textTracks && videoElement.textTracks.length > 0) {
            videoElement.textTracks[0].mode = 'hidden';
          }
        } else {
          // Try to start playback if autoplay is enabled
          if (videoElement.autoplay || videoElement.readyState >= 3) {
            videoElement.play().then(function() {
              // Playback started
            }).catch(function(e) {
              console.warn('[Foam] Playback failed:', e);
            });
          }
        }

        postMessage('ready');
      });
    });
  }

  function getPlayerState() {
    var video = document.querySelector('video');
    if (!video) return null;
    return {
      isPaused: video.paused,
      muted: video.muted,
      volume: video.volume,
      currentTime: video.currentTime || 0,
      duration: video.duration || 0,
      isBuffering: video.readyState < 3,
      isReady: true
    };
  }

  var lastState = null;

  function sendStateUpdate() {
    var state = getPlayerState();
    if (!state) return;

    // Only send update if state actually changed (excluding currentTime which changes constantly)
    if (lastState &&
        lastState.isPaused === state.isPaused &&
        lastState.muted === state.muted &&
        lastState.volume === state.volume &&
        lastState.isBuffering === state.isBuffering) {
      return;
    }

    lastState = state;
    postMessage('stateUpdate', state);
  }

  // Reduced polling interval - 5 seconds instead of 2
  // State changes are primarily tracked via event listeners now
  setInterval(sendStateUpdate, 5000);

  // Playback recovery: detect stuck video and attempt to resume
  // This handles cases where first frame loads but video freezes
  var lastTime = -1;
  var stuckCount = 0;

  function checkPlaybackStuck() {
    var video = document.querySelector('video');
    if (!video) return;

    // Only check if video should be playing
    if (video.paused || video.ended) {
      lastTime = -1;
      stuckCount = 0;
      return;
    }

    var currentTime = video.currentTime;

    // If time hasn't changed and we're supposed to be playing, we might be stuck
    if (lastTime >= 0 && Math.abs(currentTime - lastTime) < 0.1) {
      stuckCount++;
      console.log('[Foam] Possible stuck playback detected, count:', stuckCount,
        'time:', currentTime, 'readyState:', video.readyState);

      if (stuckCount >= 3) {
        console.log('[Foam] Attempting playback recovery...');

        // Try multiple recovery strategies
        if (video.readyState >= 2) {
          // Strategy 1: Pause and play
          video.pause();
          setTimeout(function() {
            video.play().then(function() {
              console.log('[Foam] Recovery: play() succeeded');
            }).catch(function(e) {
              console.log('[Foam] Recovery: play() failed:', e.message);
            });
          }, 100);
        }

        stuckCount = 0;
      }
    } else {
      stuckCount = 0;
    }

    lastTime = currentTime;
  }

  // Check every 2 seconds for stuck playback
  setInterval(checkPlaybackStuck, 2000);

  console.log('[Foam] Starting initialization...');
  console.log('[Foam] Current URL:', window.location.href);

  acceptContentWarning();
  hideDefaultOverlay();
  initVideo();

  setInterval(function() {
    acceptContentWarning();
  }, 2000);

  // Check for errors after a delay to allow page to load
  setTimeout(function() {
    checkForErrors();
  }, 5000);

  // Periodic error check for streams that go offline
  setInterval(function() {
    checkForErrors();
  }, 30000);

  // Periodic video rendering check - detect blank/audio-only issues
  setInterval(function() {
    var video = document.querySelector('video');
    if (!video) return;

    var container = video.closest('[data-a-target="player-container"]') || video.parentElement;
    var containerRect = container ? container.getBoundingClientRect() : null;
    var videoRect = video.getBoundingClientRect();
    var computedStyle = window.getComputedStyle(video);

  }, 5000);

  // Expose control functions
  window.playerControls = {
    play: function() {
      var v = document.querySelector('video');
      if (v) {
        v.play().catch(function() {});
        v.muted = false;
        v.volume = 1.0;
      }
    },
    pause: function() {
      var v = document.querySelector('video');
      if (v) v.pause();
    },
    mute: function() {
      var v = document.querySelector('video');
      if (v) v.muted = true;
    },
    unmute: function() {
      var v = document.querySelector('video');
      if (v) {
        v.muted = false;
        v.volume = 1.0;
      }
    },
    setVolume: function(vol) {
      var v = document.querySelector('video');
      if (v) {
        v.volume = vol;
        if (vol > 0) v.muted = false;
      }
    },
    seek: function(time) {
      var v = document.querySelector('video');
      if (v) v.currentTime = time;
    }
  };
})();
true;
`;

interface ControlsOverlayProps {
  isVisible: boolean;
  onBackPress?: () => void;
  onPipPress?: () => void;
  onPlayPausePress: () => void;
  onRefresh?: () => void;
  onToggleControls: () => void;
  paused: boolean;
  showPip?: boolean;
  streamInfo?: StreamInfo;
}

/**
 * Format seconds to duration string (e.g., "6:40:05")
 */
function formatDuration(startedAt?: string): string {
  if (!startedAt) return '0:00';
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - start) / 1000);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format viewer count (e.g., "52,564")
 */
function formatViewerCount(count?: number): string {
  if (!count) return '0';
  return count.toLocaleString();
}

function ControlsOverlay({
  isVisible,
  onBackPress,
  onPipPress,
  onPlayPausePress,
  onRefresh,
  onToggleControls,
  paused,
  showPip = Platform.OS === 'ios',
  streamInfo,
}: ControlsOverlayProps) {
  const opacity = useSharedValue(0);
  const [duration, setDuration] = useState(() =>
    formatDuration(streamInfo?.startedAt),
  );

  useEffect(() => {
    if (!streamInfo?.startedAt) return;

    const interval = setInterval(() => {
      setDuration(formatDuration(streamInfo.startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [streamInfo?.startedAt]);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: 200,
      easing: Easing.ease,
    });
  }, [isVisible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0.5 ? 'auto' : 'none',
  }));

  const overlayTapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        'worklet';

        runOnJS(onToggleControls)();
      }),
    [onToggleControls],
  );

  return (
    <Animated.View style={[styles.controlsOverlay, animatedStyle]}>
      <GestureDetector gesture={overlayTapGesture}>
        <View style={styles.overlayBackground} />
      </GestureDetector>

      <View pointerEvents="none" style={styles.gradientTop} />
      <View pointerEvents="none" style={styles.gradientBottom} />

      <View style={styles.header}>
        {onBackPress && (
          <View style={styles.headerButtonContainer}>
            <Button
              label="Back"
              style={styles.headerButton}
              onPress={onBackPress}
            >
              <Icon color="#FFFFFF" icon="chevron-left" size={24} />
            </Button>
          </View>
        )}

        <View style={styles.streamerNameContainer}>
          <Text numberOfLines={1} style={styles.streamerName}>
            {streamInfo?.userName || streamInfo?.userLogin || ''}
          </Text>
        </View>

        <View style={styles.spacer} />
      </View>

      <View style={styles.centerControls}>
        <Button
          label={paused ? 'Play' : 'Pause'}
          style={styles.playPauseButton}
          onPress={onPlayPausePress}
        >
          <Icon color="#FFFFFF" icon={paused ? 'play' : 'pause'} size={40} />
        </Button>
      </View>

      <View style={styles.bottomControls}>
        <View style={styles.liveIndicatorContainer}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        </View>

        <View style={styles.viewerCountContainer}>
          <Icon icon="user" size={20} style={styles.userIcon} />
          <Text style={styles.viewerCountText}>
            {formatViewerCount(streamInfo?.viewerCount)}
          </Text>
        </View>

        <View style={styles.spacer} />
        {onRefresh && (
          <View style={styles.controlButtonContainer}>
            <Button
              label="Refresh"
              style={styles.controlButton}
              onPress={onRefresh}
            >
              <Icon color="#FFFFFF" icon="refresh-cw" size={18} />
            </Button>
          </View>
        )}

        {showPip && onPipPress && (
          <View style={styles.controlButtonContainer}>
            <Button
              label="Picture in Picture"
              style={styles.controlButton}
              onPress={onPipPress}
            >
              <Icon
                color="#FFFFFF"
                icon="picture-in-picture-bottom-right"
                iconFamily="MaterialCommunityIcons"
                size={20}
              />
            </Button>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export const StreamPlayer = forwardRef<StreamPlayerRef, StreamPlayerProps>(
  function StreamPlayer(
    {
      autoplay = true,
      channel,
      height,
      muted: initialMuted = false,
      onBackPress,
      onEnded,
      onError,
      onOffline,
      onOnline,
      onPause,
      onPlay,
      onReady,
      onRefresh,
      parent = 'foam-app.com',
      showOverlayControls = true,
      streamInfo,
      video,
      width,
    },
    ref,
  ) {
    const { width: screenWidth } = useWindowDimensions();
    const webViewRef = useRef<WebView>(null);

    const [playerState, setPlayerState] = useState<PlayerState>({
      channel,
      currentTime: 0,
      duration: 0,
      isBuffering: true,
      isPaused: !autoplay,
      isReady: false,
      muted: initialMuted,
      quality: 'auto',
      volume: 1,
    });

    const [controlsVisible, setControlsVisible] = useState(false);
    const controlsVisibleRef = useRef(false);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    // Track last known video time for stuck detection
    const lastVideoTimeRef = useRef<number>(-1);
    const stuckCountRef = useRef<number>(0);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        console.log(
          '[StreamPlayer] App state changed:',
          appStateRef.current,
          '->',
          nextAppState,
        );

        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          console.log('[StreamPlayer] App resumed - checking video health');

          // Give the WebView a moment to resume, then check if video is playing
          setTimeout(() => {
            if (webViewRef.current && playerState.isReady) {
              // Inject a health check that will try to resume if stuck
              webViewRef.current.injectJavaScript(`
                (function() {
                  var video = document.querySelector('video');
                  if (video) {
                    console.log('[Foam] App resumed - video state:', {
                      paused: video.paused,
                      readyState: video.readyState,
                      currentTime: video.currentTime
                    });
                    // If video should be playing but appears stuck, try to resume
                    if (!video.paused && video.readyState >= 2) {
                      video.play().catch(function(e) {
                        console.log('[Foam] Resume play failed:', e.message);
                      });
                    }
                  }
                })();
                true;
              `);
            }
          }, 500);
        }

        appStateRef.current = nextAppState;
      };

      const subscription = AppState.addEventListener(
        'change',
        handleAppStateChange,
      );

      return () => {
        subscription.remove();
      };
    }, [playerState.isReady]);

    // Video health monitoring - detect and recover from stuck playback
    useEffect(() => {
      if (!playerState.isReady || playerState.isPaused) {
        lastVideoTimeRef.current = -1;
        stuckCountRef.current = 0;
        return;
      }

      const healthCheckInterval = setInterval(() => {
        if (!webViewRef.current) return;

        // Query current video time
        webViewRef.current.injectJavaScript(`
          (function() {
            var video = document.querySelector('video');
            if (video && !video.paused) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'healthCheck',
                payload: {
                  currentTime: video.currentTime,
                  readyState: video.readyState,
                  networkState: video.networkState,
                  paused: video.paused
                }
              }));
            }
          })();
          true;
        `);
      }, 3000);

      return () => clearInterval(healthCheckInterval);
    }, [playerState.isReady, playerState.isPaused]);

    const currentTimeResolverRef = useRef<((value: number) => void) | null>(
      null,
    );
    const durationResolverRef = useRef<((value: number) => void) | null>(null);

    const injectJS = useCallback((script: string) => {
      webViewRef.current?.injectJavaScript(`${script}; true;`);
    }, []);

    const play = useCallback(() => {
      injectJS('window.playerControls.play()');
    }, [injectJS]);

    const pause = useCallback(() => {
      injectJS('window.playerControls.pause()');
    }, [injectJS]);

    const mute = useCallback(() => {
      injectJS('window.playerControls.mute()');
    }, [injectJS]);

    const unmute = useCallback(() => {
      injectJS('window.playerControls.unmute()');
    }, [injectJS]);

    const setMuted = useCallback(
      (muted: boolean) => {
        injectJS(`window.playerControls.setMuted(${muted})`);
      },
      [injectJS],
    );

    const setVolume = useCallback(
      (volume: number) => {
        injectJS(`window.playerControls.setVolume(${volume})`);
      },
      [injectJS],
    );

    const setChannel = useCallback(
      (newChannel: string) => {
        injectJS(`window.playerControls.setChannel('${newChannel}')`);
      },
      [injectJS],
    );

    const setVideo = useCallback(
      (videoId: string, timestamp?: number) => {
        injectJS(
          `window.playerControls.setVideo('${videoId}', ${timestamp ?? 0})`,
        );
      },
      [injectJS],
    );

    const setQuality = useCallback(
      (quality: string) => {
        injectJS(`window.playerControls.setQuality('${quality}')`);
      },
      [injectJS],
    );

    const seek = useCallback(
      (timestamp: number) => {
        injectJS(`window.playerControls.seek(${timestamp})`);
      },
      [injectJS],
    );

    const getCurrentTime = useCallback((): Promise<number> => {
      return new Promise(resolve => {
        currentTimeResolverRef.current = resolve;
        injectJS('window.playerControls.getCurrentTime()');

        setTimeout(() => {
          if (currentTimeResolverRef.current) {
            currentTimeResolverRef.current(playerState.currentTime);
            currentTimeResolverRef.current = null;
          }
        }, 1000);
      });
    }, [injectJS, playerState.currentTime]);

    const getDuration = useCallback((): Promise<number> => {
      return new Promise(resolve => {
        durationResolverRef.current = resolve;
        injectJS('window.playerControls.getDuration()');

        setTimeout(() => {
          if (durationResolverRef.current) {
            durationResolverRef.current(playerState.duration);
            durationResolverRef.current = null;
          }
        }, 1000);
      });
    }, [injectJS, playerState.duration]);

    /**
     * Force refresh the player - hard reload via about:blank
     * This is the most reliable way to recover from frozen/stuck playback
     */
    const forceRefresh = useCallback(() => {
      console.log('[StreamPlayer] Force refresh triggered');
      setPlayerState(prev => ({
        ...prev,
        isReady: false,
        isBuffering: true,
      }));

      // Hard refresh: load blank page first, then reload
      webViewRef.current?.injectJavaScript(`
        window._injected = false;
        window._cleanupInterval && clearInterval(window._cleanupInterval);
      `);

      setTimeout(() => {
        webViewRef.current?.reload();
      }, 100);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        forceRefresh,
        getChannel: () => playerState.channel,
        getCurrentTime,
        getDuration,
        getMuted: () => playerState.muted,
        getPaused: () => playerState.isPaused,
        getVolume: () => playerState.volume,
        mute,
        pause,
        play,
        seek,
        setChannel,
        setMuted,
        setQuality,
        setVideo,
        setVolume,
        unmute,
      }),
      [
        forceRefresh,
        getCurrentTime,
        getDuration,
        mute,
        pause,
        play,
        playerState.channel,
        playerState.isPaused,
        playerState.muted,
        playerState.volume,
        seek,
        setChannel,
        setMuted,
        setQuality,
        setVideo,
        setVolume,
        unmute,
      ],
    );

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as PlayerMessage;
          console.log('[StreamPlayer] Message received:', message.type);

          switch (message.type) {
            case 'ready':
              console.log('[StreamPlayer] Player ready');

              setPlayerState(prev => ({
                ...prev,
                isReady: true,
                isBuffering: false,
              }));
              onReady?.();
              break;
            case 'play':
              setPlayerState(prev => ({ ...prev, isPaused: false }));
              onPlay?.();
              break;
            case 'pause':
              setPlayerState(prev => ({ ...prev, isPaused: true }));
              onPause?.();
              break;
            case 'ended':
              onEnded?.();
              break;
            case 'online':
              onOnline?.();
              break;
            case 'offline':
              onOffline?.();
              break;
            case 'stateUpdate':
              /**
               * Only update the player if values change to avoid re-renders
               */
              setPlayerState(prev => {
                const { payload } = message;
                if (
                  prev.isPaused === payload.isPaused &&
                  prev.muted === payload.muted &&
                  prev.volume === payload.volume &&
                  prev.isReady === payload.isReady &&
                  prev.isBuffering === payload.isBuffering
                ) {
                  return prev;
                }
                return { ...prev, ...payload };
              });
              break;
            case 'currentTime':
              if (currentTimeResolverRef.current) {
                currentTimeResolverRef.current(message.payload.time);
                currentTimeResolverRef.current = null;
              }
              break;
            case 'duration':
              if (durationResolverRef.current) {
                durationResolverRef.current(message.payload.duration);
                durationResolverRef.current = null;
              }
              break;
            case 'error':
              console.error(
                '[StreamPlayer] Error from WebView:',
                message.payload.message,
              );
              onError?.(message.payload.message);
              break;
            case 'healthCheck': {
              // Handle health check responses for stuck detection
              const { currentTime, readyState, paused } = message.payload as {
                currentTime: number;
                networkState: number;
                paused: boolean;
                readyState: number;
              };

              if (paused) {
                // Video is paused, reset stuck detection
                lastVideoTimeRef.current = -1;
                stuckCountRef.current = 0;
                break;
              }

              // Check if video time is not advancing
              if (
                lastVideoTimeRef.current >= 0 &&
                Math.abs(currentTime - lastVideoTimeRef.current) < 0.1
              ) {
                stuckCountRef.current += 1;
                console.log(
                  '[StreamPlayer] Video may be stuck, count:',
                  stuckCountRef.current,
                  'time:',
                  currentTime,
                  'readyState:',
                  readyState,
                );

                // After 3 consecutive stuck detections (9 seconds), attempt recovery
                if (stuckCountRef.current >= 3) {
                  console.log(
                    '[StreamPlayer] Video stuck detected - attempting recovery',
                  );

                  // Try to resume playback first
                  webViewRef.current?.injectJavaScript(`
                    (function() {
                      var video = document.querySelector('video');
                      if (video) {
                        console.log('[Foam] Attempting stuck recovery...');
                        video.currentTime = video.currentTime + 0.1;
                        video.play().catch(function(e) {
                          console.log('[Foam] Recovery play failed:', e.message);
                        });
                      }
                    })();
                    true;
                  `);

                  stuckCountRef.current = 0;
                }
              } else {
                stuckCountRef.current = 0;
              }

              lastVideoTimeRef.current = currentTime;
              break;
            }
            default:
              console.log(
                '[StreamPlayer] Unknown message type:',
                (message as { type: string }).type,
              );
              break;
          }
        } catch (e) {
          console.error(
            '[StreamPlayer] Failed to parse message:',
            e,
            event.nativeEvent.data,
          );
        }
      },
      [onEnded, onError, onOffline, onOnline, onPause, onPlay, onReady],
    );

    const playerUrl = useMemo(
      () =>
        generatePlayerURL({
          channel,
          parent,
          video,
        }),
      [channel, parent, video],
    );

    const showControls = useCallback(() => {
      controlsVisibleRef.current = true;
      setControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        controlsVisibleRef.current = false;
        setControlsVisible(false);
      }, 5000);
    }, []);

    const dismissControls = useCallback(() => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsVisibleRef.current = false;
      setControlsVisible(false);
    }, []);

    useEffect(() => {
      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }, []);

    const toggleControlsInternal = useCallback(() => {
      console.log(
        '[StreamPlayer] Tap detected, controlsVisible:',
        controlsVisibleRef.current,
      );
      if (controlsVisibleRef.current) {
        dismissControls();
      } else {
        showControls();
      }
    }, [dismissControls, showControls]);

    const tapGesture = useMemo(
      () =>
        Gesture.Tap().onEnd(() => {
          'worklet';

          scheduleOnRN(toggleControlsInternal);
        }),
      [toggleControlsInternal],
    );

    const handlePlayPause = useCallback(() => {
      if (playerState.isPaused) {
        play();
      } else {
        pause();
      }
      showControls();
    }, [pause, play, playerState.isPaused, showControls]);

    const handlePipPress = useCallback(() => {
      console.log('PiP pressed');
    }, []);

    const handleWebViewError = useCallback(
      (event: { nativeEvent: WebViewError }) => {
        const { nativeEvent } = event;
        const error = new Error(
          `StreamPlayer WebView error: ${nativeEvent.description}`,
        );

        console.error('[StreamPlayer] WebView error:', {
          code: nativeEvent.code,
          description: nativeEvent.description,
          url: nativeEvent.url,
          channel,
        });

        sentryService.captureException(error, {
          tags: {
            component: 'StreamPlayer',
            errorType: 'webview_error',
          },
          extra: {
            code: nativeEvent.code,
            description: nativeEvent.description,
            url: nativeEvent.url,
            channel,
          },
        });

        onError?.(nativeEvent.description);
      },
      [channel, onError],
    );

    const handleWebViewHttpError = useCallback(
      (event: { nativeEvent: WebViewHttpError }) => {
        const { nativeEvent } = event;
        const error = new Error(
          `StreamPlayer HTTP error: ${nativeEvent.statusCode} ${nativeEvent.description}`,
        );

        console.error('[StreamPlayer] HTTP error:', {
          statusCode: nativeEvent.statusCode,
          description: nativeEvent.description,
          url: nativeEvent.url,
          channel,
        });

        sentryService.captureException(error, {
          tags: {
            component: 'StreamPlayer',
            errorType: 'http_error',
          },
          extra: {
            statusCode: nativeEvent.statusCode,
            description: nativeEvent.description,
            url: nativeEvent.url,
            channel,
          },
        });

        onError?.(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.description}`);
      },
      [channel, onError],
    );

    const TWITCH_MIN_WIDTH = 400;
    const TWITCH_MIN_HEIGHT = 300;

    const rawWidth = width ?? screenWidth;
    const rawHeight =
      height ??
      (typeof width === 'number' ? width * (9 / 16) : screenWidth * (9 / 16));

    const playerWidth: DimensionValue =
      typeof rawWidth === 'number'
        ? Math.max(rawWidth, TWITCH_MIN_WIDTH)
        : rawWidth;
    const playerHeight: DimensionValue =
      typeof rawHeight === 'number'
        ? Math.max(rawHeight, TWITCH_MIN_HEIGHT)
        : rawHeight;

    useEffect(() => {
      console.log('[StreamPlayer] Player URL:', playerUrl);
      console.log('[StreamPlayer] Channel:', channel);
      console.log('[StreamPlayer] Screen width:', screenWidth);
      console.log('[StreamPlayer] Player dimensions:', {
        width: playerWidth,
        height: playerHeight,
        rawWidth,
        rawHeight,
      });
      if (typeof playerWidth === 'number' && typeof playerHeight === 'number') {
        if (
          playerWidth < TWITCH_MIN_WIDTH ||
          playerHeight < TWITCH_MIN_HEIGHT
        ) {
          console.warn(
            '[StreamPlayer] WARNING: Below Twitch minimum size (400x300)!',
          );
        }
      }
    }, [
      channel,
      playerUrl,
      screenWidth,
      playerWidth,
      playerHeight,
      rawWidth,
      rawHeight,
    ]);

    return (
      <View
        collapsable={false}
        style={[styles.container, { height: playerHeight, width: playerWidth }]}
        onLayout={e => {
          const { width: w, height: h } = e.nativeEvent.layout;

          console.log('[StreamPlayer] Container layout:', {
            width: w,
            height: h,
          });
          if (w < 400 || h < 300) {
            console.warn(
              '[StreamPlayer] WARNING: Below Twitch minimum size (400x300)',
            );
          }
        }}
      >
        <WebView
          collapsable={false}
          allowsInlineMediaPlayback
          allowsBackForwardNavigationGestures={false}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          injectedJavaScriptBeforeContentLoaded={`
            window.onerror = function(msg, url, line, col, error) {
              console.log('[Foam-Early] Error:', msg, 'at', url, line);
              return false;
            };
            console.log('[Foam-Early] Page loading:', window.location.href);
            true;
          `}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          javaScriptEnabled
          originWhitelist={['*']}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          source={{ uri: playerUrl }}
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.webView, { minWidth: 400, minHeight: 300 }]}
          userAgent={
            Platform.OS === 'ios'
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
              : 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
          }
          onContentProcessDidTerminate={(e: {
            nativeEvent: { didCrash?: boolean };
          }) => {
            console.error(
              '[StreamPlayer] WebView process terminated!',
              e.nativeEvent,
            );
            webViewRef.current?.reload();
          }}
          onError={handleWebViewError}
          onHttpError={handleWebViewHttpError}
          onLoad={() => console.log('[StreamPlayer] WebView onLoad fired')}
          onLoadEnd={() => console.log('[StreamPlayer] WebView load ended')}
          onLoadProgress={(e: { nativeEvent: { progress: number } }) => {
            if (e.nativeEvent.progress === 1) {
              console.log('[StreamPlayer] WebView load progress: 100%');
            }
          }}
          onLoadStart={() => console.log('[StreamPlayer] WebView load started')}
          onMessage={handleMessage}
          onNavigationStateChange={(navState: {
            url: string;
            title: string;
            loading: boolean;
            canGoBack: boolean;
          }) => {
            console.log('[StreamPlayer] Navigation state:', {
              url: navState.url,
              title: navState.title,
              loading: navState.loading,
              canGoBack: navState.canGoBack,
            });
          }}
          onRenderProcessGone={(e: { nativeEvent: { didCrash?: boolean } }) => {
            console.error(
              '[StreamPlayer] WebView render process gone!',
              e.nativeEvent,
            );
            webViewRef.current?.reload();
          }}
        />

        <GestureDetector gesture={tapGesture}>
          <View style={styles.tapArea} />
        </GestureDetector>

        {showOverlayControls && (
          <ControlsOverlay
            isVisible={controlsVisible}
            paused={playerState.isPaused}
            streamInfo={streamInfo}
            onBackPress={onBackPress}
            onPipPress={handlePipPress}
            onPlayPausePress={handlePlayPause}
            onRefresh={onRefresh}
            onToggleControls={toggleControlsInternal}
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create((theme, rt) => ({
  avatar: {
    borderRadius: theme.radii.full,
    height: theme.spacing['4xl'],
    marginRight: theme.spacing.sm,
    width: theme.spacing['4xl'],
  },
  userIcon: {
    backgroundColor: theme.colors.accent.accentAlpha,
  },
  bottomControls: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    left: 0,
    paddingBottom: rt.insets.bottom + 4,
    paddingHorizontal: theme.spacing.sm,
    position: 'absolute',
    right: 0,
  },
  centerControls: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    backgroundColor: theme.colors.gray.bg,
    overflow: 'hidden',
    paddingTop: rt.insets.top,
    position: 'relative',
  },
  controlButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  controlButtonContainer: {
    alignItems: 'center',
    borderRadius: theme.radii.sm,
    height: 20,
    justifyContent: 'center',
    width: 36,
  },
  controlsOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  durationText: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '500',
  },
  gameName: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xxs,
    marginLeft: theme.spacing.sm,
    opacity: 0.9,
  },
  gameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  gradientBottom: {
    backgroundColor: theme.colors.black.borderHoverAlpha,
    bottom: 0,
    height: 80,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  gradientTop: {
    backgroundColor: theme.colors.black.borderHoverAlpha,
    height: 80,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    left: 0,
    paddingHorizontal: theme.spacing.xs,
    paddingTop: rt.insets.top + 2,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  headerButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerButtonContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  liveDot: {
    backgroundColor: theme.colors.red.accent,
    borderRadius: theme.radii.full,
    height: 8,
    marginRight: theme.spacing.sm,
    width: 8,
  },
  liveIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  liveIndicatorContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.bg,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  overlayBackground: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  playPauseButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  spacer: {
    flex: 1,
  },
  tapArea: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  streamerLogin: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xs,
    fontWeight: '400',
    opacity: 0.7,
  },
  streamerName: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xs,
    fontWeight: '600',
  },
  streamerNameContainer: {
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  viewerCount: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: theme.spacing.md,
  },
  viewerCountContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  viewerCountText: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '500',
  },
  webView: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
}));
