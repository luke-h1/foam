import type { Ref } from 'react';
import type { DimensionValue } from 'react-native';

export interface StreamPlayerRef {
  forceRefresh: () => void;
  getChannel: () => string | undefined;
  /**
   * Playback position in seconds.
   */
  getCurrentTime: () => Promise<number>;
  /**
   * Total duration in seconds; VODs only.
   */
  getDuration: () => Promise<number>;
  getMuted: () => boolean;
  getPaused: () => boolean;
  /**
   * Volume is 0-1.
   */
  getVolume: () => number;
  mute: () => void;
  pause: () => void;
  play: () => void;
  /**
   * Timestamp in seconds; VODs only.
   */
  seek: (timestamp: number) => void;
  setChannel: (channel: string) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (quality: string) => void;
  setVideo: (videoId: string, timestamp?: number) => void;
  /**
   * Volume is 0-1.
   */
  setVolume: (volume: number) => void;
  isPictureInPicture: () => boolean;
  togglePictureInPicture: () => void;
  /**
   * Pause and drop the <video> source so the WebView can be torn down without
   * an active AVPlayer wedging the transition.
   */
  releaseMedia: () => void;
  syncToLive: () => void;
  unmute: () => void;
}

export interface StreamInfo {
  gameName?: string;
  profileImageUrl?: string;
  /**
   * ISO string; used to calculate stream duration.
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
  /**
   * Twitch clip slug
   */
  clip?: string;

  height?: DimensionValue;

  deferOverlayUntilUserUnmute?: boolean;
  /**
   * @default false
   */
  muted?: boolean;
  onBackPress?: () => void;
  onContentGateChange?: (hasGate: boolean) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onOffline?: () => void;
  onOnline?: () => void;
  onPause?: () => void;
  onPlaybackLatencyChange?: (latencySeconds: number) => void;
  onPlay?: () => void;
  onReady?: () => void;
  onRefresh?: () => void;
  onSharePress?: () => void;
  onCreateClipPress?: () => void;
  onSleepTimerPress?: () => void;
  sleepTimerActive?: boolean;
  onVideoAreaPress?: () => void;
  onVideoAreaSwipeDown?: () => void;
  /**
   * Fires when the embed WebView finishes loading; used to defer IRC connect
   * until the player is ready.
   */
  onWebViewLoaded?: () => void;
  /**
   * Parent domain for the Twitch embed. Used by the web player only; native
   * hardcodes `www.twitch.tv`, the domain Twitch's embed always accepts.
   */
  parent?: string;
  /**
   * Thumbnail shown behind the loading spinner while the WebView boots, so the
   * user sees the preview frame instead of a black box.
   */
  posterUrl?: string;
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
  | { payload: { hasContentGate: boolean }; type: 'contentGateDetected' }
  | { type: 'ended' }
  | { type: 'offline' }
  | { type: 'online' }
  | { type: 'pause' }
  | { type: 'play' }
  | { payload: { errName: string | null }; type: 'playbackBlocked' }
  | { type: 'pipChanged'; payload: { active: boolean } }
  | { type: 'pipUnavailable' }
  | { type: 'playing' }
  | { type: 'ready' }
  | { type: 'trace'; payload: { step: string; detail?: string } }
  | { type: 'twitchAuthComplete' }
  | {
      type: 'embedMisconfigured';
      payload: { message: string; parent: string | null };
    }
  | { type: 'muteState'; payload: { muted: boolean; volume: number } }
  | { type: 'vodProgress'; payload: { currentTime: number } };
