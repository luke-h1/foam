import type { Ref } from 'react';
import type { DimensionValue } from 'react-native';

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
   * Release the underlying media (pause + drop the <video> source) so the
   * WebView can be torn down without an active AVPlayer wedging the transition.
   */
  releaseMedia: () => void;
  /**
   * Seek a live stream back to the live edge to trim accumulated client latency
   */
  syncToLive: () => void;
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
   * Twitch clip slug
   */
  clip?: string;

  /**
   * Height of the player
   */
  height?: DimensionValue;

  deferOverlayUntilUserUnmute?: boolean;
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
   * Callback when content gate (e.g. login required) is detected or dismissed
   */
  onContentGateChange?: (hasGate: boolean) => void;
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
   * Callback with Twitch's reported latency from broadcaster to viewer.
   */
  onPlaybackLatencyChange?: (latencySeconds: number) => void;
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
   * Callback when the share button is pressed in the overlay controls.
   */
  onSharePress?: () => void;
  /**
   * Callback when the sleep timer button is pressed in the overlay controls.
   */
  onSleepTimerPress?: () => void;
  /**
   * Whether a sleep timer is currently counting down; tints the overlay button.
   */
  sleepTimerActive?: boolean;
  /**
   * Optional callback when the user taps the video area (e.g. to toggle chat in landscape).
   */
  onVideoAreaPress?: () => void;
  /**
   * Optional callback when the user swipes down on the video area.
   */
  onVideoAreaSwipeDown?: () => void;
  /**
   * Callback when the embed WebView has finished loading. Use to sync IRC connections (only after player is ready).
   */
  onWebViewLoaded?: () => void;
  /**
   * Parent domain for Twitch embed. Must be an HTTPS domain you added in the
   * Twitch Developer Console (e.g. foam-app.com). We send Referer/Origin so Twitch validates.
   * @default 'foam-app.com'
   */
  parent?: string;
  /**
   * Thumbnail shown (behind a loading spinner) while the WebView player boots,
   * so the user sees the stream's preview frame instead of a black box.
   */
  posterUrl?: string;
  /**
   * Base URL for stream proxy (e.g. http://localhost:4000).
   * When set, WebView loads Twitch embed via proxy instead of direct player URL.
   */
  streamProxyBaseUrl?: string;
  /**
   * Show custom overlay controls
   * @default false
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
  ref?: Ref<StreamPlayerRef>;
}

export interface PlayerState {
  channel?: string;
  currentTime: number;
  duration: number;
  isPaused: boolean;
  muted: boolean;
  quality: string;
  volume: number;
}

export interface PlayerStatusState {
  isBuffering: boolean;
  isReady: boolean;
}

interface PlayerStateUpdatePayload {
  isBuffering: boolean;
  isPaused: boolean;
  isReady: boolean;
  muted: boolean;
  volume: number;
}

interface PlaybackStatsPayload {
  bufferSize?: number;
  displayResolution?: string;
  fps?: number;
  hlsLatencyBroadcaster?: number | null;
  playbackRate?: number;
  skippedFrames?: number;
  videoResolution?: string;
}

export type PlayerMessage =
  | { payload: { message: string }; type: 'error' }
  | { payload: { time: number }; type: 'currentTime' }
  | { payload: { duration: number }; type: 'duration' }
  | { payload: PlayerStateUpdatePayload; type: 'stateUpdate' }
  | { payload: PlaybackStatsPayload; type: 'playbackStats' }
  | {
      payload: {
        currentTime: number;
        networkState: number;
        paused: boolean;
        readyState: number;
      };
      type: 'healthCheck';
    }
  | { payload: { hasContentGate: boolean }; type: 'contentGateDetected' }
  | {
      payload: {
        hasGate: boolean;
        gateText: string;
        hasAuthToken: boolean;
        hasAuthHyphen: boolean;
        cookieCount: number;
        href: string;
      };
      type: 'debugLog';
    }
  | { type: 'ended' }
  | { type: 'offline' }
  | { type: 'online' }
  | { type: 'pause' }
  | { type: 'play' }
  | { payload: { errName: string | null }; type: 'playbackBlocked' }
  | { payload: { stalledMs: number }; type: 'playbackRecovered' }
  | {
      payload: {
        currentTime: number;
        networkState: number;
        readyState: number;
        stalledMs: number;
      };
      type: 'playbackStalled';
    }
  | {
      payload: {
        code: number | null;
        message: string;
        networkState: number;
        readyState: number;
      };
      type: 'videoElementError';
    }
  | { type: 'playing' }
  | { type: 'ready' }
  | { type: 'trace'; payload: { step: string; detail?: string } }
  | { type: 'twitchAuthComplete' }
  | { type: 'error'; payload: { message: string } }
  | { type: 'muteState'; payload: { muted: boolean; volume: number } };
