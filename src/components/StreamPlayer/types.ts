import type { Ref } from 'react';
import type { DimensionValue } from 'react-native';

export interface StreamPlayerRef {
  forceRefresh: () => void;
  getChannel: () => string | undefined;
  /**
   * Playback time in seconds.
   */
  getCurrentTime: () => Promise<number>;
  /**
   * Total duration in seconds (VODs only).
   */
  getDuration: () => Promise<number>;
  getMuted: () => boolean;
  getPaused: () => boolean;
  /**
   * Volume level between 0 and 1.
   */
  getVolume: () => number;
  mute: () => void;
  pause: () => void;
  play: () => void;
  /**
   * Seek to a timestamp in seconds (VODs only).
   */
  seek: (timestamp: number) => void;
  setChannel: (channel: string) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (quality: string) => void;
  /**
   * @param timestamp - Optional start time in seconds
   */
  setVideo: (videoId: string, timestamp?: number) => void;
  /**
   * @param volume - Volume level between 0 and 1
   */
  setVolume: (volume: number) => void;
  /**
   * Whether the embedded video is currently in system picture-in-picture.
   */
  isPictureInPicture: () => boolean;
  /**
   * Toggle iOS system picture-in-picture on the embedded video.
   */
  togglePictureInPicture: () => void;
  /**
   * Release the underlying media (pause + drop the <video> source) so the
   * WebView can be torn down without an active AVPlayer wedging the transition.
   */
  releaseMedia: () => void;
  /**
   * Seek a live stream back to the live edge to trim accumulated client latency
   */
  syncToLive: () => void;
  unmute: () => void;
}

export interface StreamInfo {
  gameName?: string;
  profileImageUrl?: string;
  /**
   * Stream start time (ISO string) for calculating duration
   */
  startedAt?: string;
  title?: string;
  userName?: string;
  userLogin?: string;
  viewerCount?: number;
}

export interface StreamPlayerProps {
  /**
   * @default true
   */
  autoplay?: boolean;
  channel?: string;
  clip?: string;
  height?: DimensionValue;
  deferOverlayUntilUserUnmute?: boolean;
  /**
   * @default false
   */
  muted?: boolean;
  onBackPress?: () => void;
  /**
   * Callback when content gate (e.g. login required) is detected or dismissed
   */
  onContentGateChange?: (hasGate: boolean) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onOffline?: () => void;
  onOnline?: () => void;
  onPause?: () => void;
  /**
   * Callback with Twitch's reported latency from broadcaster to viewer.
   */
  onPlaybackLatencyChange?: (latencySeconds: number) => void;
  onPlay?: () => void;
  onReady?: () => void;
  onRefresh?: () => void;
  onSharePress?: () => void;
  onCreateClipPress?: () => void;
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
   * Parent domain for the Twitch embed. Used by the web player only; native
   * hardcodes `www.twitch.tv`, the domain Twitch's embed always accepts.
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
   * @default false
   */
  showOverlayControls?: boolean;
  streamInfo?: StreamInfo;
  video?: string;
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
  | { type: 'pipChanged'; payload: { active: boolean } }
  | { type: 'pipUnavailable' }
  | { type: 'playing' }
  | { type: 'ready' }
  | { type: 'trace'; payload: { step: string; detail?: string } }
  | { type: 'twitchAuthComplete' }
  | { type: 'error'; payload: { message: string } }
  | {
      type: 'embedMisconfigured';
      payload: { message: string; parent: string | null };
    }
  | { type: 'muteState'; payload: { muted: boolean; volume: number } };
