import type { Ref } from 'react';
import type { DimensionValue } from 'react-native';

export interface StreamPlayerRef {
  getPaused: () => boolean;
  pause: () => void;
  play: () => void;
  isPictureInPicture: () => boolean;
  /**
   * Pause and drop the <video> source so the WebView can be torn down without
   * an active AVPlayer wedging the transition.
   */
  releaseMedia: () => void;
  syncToLive: () => void;
}

export interface StreamInfo {
  gameName?: string;
  profileImageUrl?: string;
  /**
   * ISO 8601 timestamp.
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
  onWebViewLoaded?: () => void;
  /**
   * Parent domain for the Twitch embed. Used by the web player only; native
   * hardcodes `www.twitch.tv`, the domain Twitch's embed always accepts.
   */
  parent?: string;
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
  isPaused: boolean;
  muted: boolean;
}

export interface PlayerStatusState {
  isBuffering: boolean;
  isReady: boolean;
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
  | { payload: PlaybackStatsPayload; type: 'playbackStats' }
  | { payload: { hasContentGate: boolean }; type: 'contentGateDetected' }
  | { type: 'pause' }
  | { type: 'pipChanged'; payload: { active: boolean } }
  | { type: 'pipUnavailable' }
  | { type: 'playing' }
  | { type: 'ready' }
  | { type: 'stalled'; payload?: { frozenMs?: number } }
  | { type: 'trace'; payload: { step: string; detail?: string } }
  | { type: 'twitchAuthComplete' }
  | {
      type: 'embedMisconfigured';
      payload: { message: string; parent: string | null };
    }
  | { type: 'muteState'; payload: { muted: boolean; volume: number } }
  | { type: 'vodProgress'; payload: { currentTime: number } };
