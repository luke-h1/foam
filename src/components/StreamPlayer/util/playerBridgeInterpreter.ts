import type { PlayerMessage } from '../types';

/**
 * Snapshot of the mutable bridge state a message decision depends on, taken
 * once per incoming message. Each field mirrors a ref or prop the hook owns.
 */
export interface PlayerBridgeContext {
  autoplay: boolean;
  channel?: string;
  deferOverlayUntilUserUnmute: boolean;
  enhancedStabilityEnabled: boolean;
  lastPublishedLatencySeconds: number | null;
  mountedAtMs: number;
  nowMs: number;
  reportedFirstPlaying: boolean;
  reportedPlaybackBlocked: boolean;
  userPaused: boolean;
}

export type PlayerBridgeAction =
  | { type: 'applyMuteState'; muted: boolean; volume: number }
  | {
      type: 'applyStateUpdate';
      isPaused: boolean;
      muted: boolean;
      volume: number;
    }
  | { type: 'cancelTransientResume' }
  | {
      type: 'countMetric';
      name: string;
      attributes: Record<string, string | number | boolean>;
    }
  | {
      type: 'log';
      level: 'debug' | 'error' | 'info' | 'warn';
      message: string;
      args: unknown[];
    }
  | { type: 'markFirstPlayingReported' }
  | { type: 'markPlaybackBlockedReported' }
  | { type: 'recordLoadFailed'; reason: string; error?: unknown }
  | { type: 'recordPlaybackFreeze'; stalledMs: number }
  | {
      type: 'recordPlaybackStarted';
      startSource: 'bridge_playing';
    }
  | { type: 'notifyEnded' }
  | { type: 'notifyError'; message: string }
  | { type: 'notifyOffline' }
  | { type: 'notifyOnline' }
  | { type: 'notifyPause' }
  | { type: 'notifyPlay' }
  | { type: 'notifyReady' }
  | {
      type: 'notifyStability';
      event: 'playing' | 'recovered' | 'stalled' | 'videoError';
    }
  | { type: 'notifyStabilityLatency'; latencySeconds: number }
  | { type: 'publishLatency'; latencySeconds: number }
  | { type: 'resolveCurrentTime'; seconds: number }
  | { type: 'resolveDuration'; seconds: number }
  | { type: 'scheduleAuthCompletionReload' }
  | { type: 'scheduleTransientResume' }
  | { type: 'setContentGate'; hasContentGate: boolean }
  | { type: 'setPaused'; isPaused: boolean }
  | { type: 'setPipActive'; active: boolean }
  | { type: 'setPlayerReady' }
  | { type: 'setPlayerStatus'; isBuffering: boolean; isReady: boolean }
  | { type: 'showPipUnavailableToast' }
  | { type: 'unlockOverlay' };

/**
 * Pure interpreter for WebView player bridge messages: given a parsed message
 * and a context snapshot, returns the ordered actions the hook must execute.
 * Unknown message types and non-object payloads interpret to no actions.
 */
export function interpretPlayerMessage(
  message: PlayerMessage,
  context: PlayerBridgeContext,
): PlayerBridgeAction[] {
  if (typeof message !== 'object' || message === null) {
    return [];
  }

  const elapsedMs = context.nowMs - context.mountedAtMs;
  const shouldResumeTransientPause = context.autoplay && !context.userPaused;

  switch (message.type) {
    case 'ready':
      return [
        {
          type: 'countMetric',
          name: 'stream.ready',
          attributes: {
            autoplay: context.autoplay,
            component: 'StreamPlayer',
            defer_overlay_until_user_unmute:
              context.deferOverlayUntilUserUnmute,
          },
        },
        {
          type: 'log',
          level: 'info',
          message: 'player ready',
          args: [
            {
              name: 'twitch_player_info',
              channel: context.channel,
              elapsedMs,
            },
          ],
        },
        { type: 'setPlayerReady' },
        { type: 'notifyReady' },
      ];
    case 'play':
      return [
        { type: 'cancelTransientResume' },
        { type: 'setPaused', isPaused: false },
      ];
    case 'playing': {
      const actions: PlayerBridgeAction[] = [
        { type: 'cancelTransientResume' },
        { type: 'notifyStability', event: 'playing' },
      ];
      if (!context.reportedFirstPlaying) {
        actions.push(
          { type: 'markFirstPlayingReported' },
          { type: 'recordPlaybackStarted', startSource: 'bridge_playing' },
          {
            type: 'countMetric',
            name: 'stream.playing',
            attributes: {
              autoplay: context.autoplay,
              channel: context.channel ?? 'unknown',
              component: 'StreamPlayer',
            },
          },
          {
            type: 'log',
            level: 'info',
            message: 'first playing',
            args: [
              {
                name: 'twitch_player_info',
                channel: context.channel,
                elapsedMs,
              },
            ],
          },
        );
      }
      actions.push(
        { type: 'setPaused', isPaused: false },
        { type: 'notifyPlay' },
      );
      return actions;
    }
    case 'pause':
      if (shouldResumeTransientPause) {
        return [{ type: 'scheduleTransientResume' }];
      }
      return [{ type: 'setPaused', isPaused: true }, { type: 'notifyPause' }];
    case 'ended':
      return [{ type: 'notifyEnded' }];
    case 'online':
      return [{ type: 'notifyOnline' }];
    case 'offline':
      return [{ type: 'notifyOffline' }];
    case 'stateUpdate': {
      const payload = message.payload;
      if (!payload) {
        return [];
      }

      const isTransientAutoplayPause =
        payload.isPaused && shouldResumeTransientPause;
      const actions: PlayerBridgeAction[] = [
        {
          type: 'setPlayerStatus',
          isReady: payload.isReady,
          isBuffering: payload.isBuffering,
        },
      ];
      if (isTransientAutoplayPause) {
        actions.push({ type: 'scheduleTransientResume' });
      }
      actions.push({
        type: 'applyStateUpdate',
        isPaused: isTransientAutoplayPause ? false : payload.isPaused,
        muted: payload.muted,
        volume: payload.volume,
      });
      return actions;
    }
    case 'currentTime':
      if (!message.payload || message.payload.time === undefined) {
        return [];
      }
      return [{ type: 'resolveCurrentTime', seconds: message.payload.time }];
    case 'duration':
      if (!message.payload || message.payload.duration === undefined) {
        return [];
      }
      return [{ type: 'resolveDuration', seconds: message.payload.duration }];
    case 'trace':
      return [
        {
          type: 'log',
          level: 'debug',
          message: '[StreamPlayer:embed]',
          args: [message.payload?.step ?? '?', message.payload?.detail ?? ''],
        },
      ];
    case 'error': {
      const embedMessage = message.payload?.message ?? 'Unknown embed error';
      const embedErrorMetadata = {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerEmbedError',
        fingerprint: ['stream-player-embed-error'],
        channel: context.channel,
        elapsedMs,
        message: embedMessage,
      };
      return [
        {
          type: 'recordLoadFailed',
          reason: 'embed_error',
          error: embedErrorMetadata,
        },
        {
          type: 'log',
          level: 'warn',
          message: `[StreamPlayer:embed ERROR] ${embedMessage}`,
          args: [embedErrorMetadata],
        },
        {
          type: 'notifyError',
          message: embedMessage,
        },
      ];
    }
    case 'contentGateDetected':
      return [
        {
          type: 'setContentGate',
          hasContentGate: message.payload?.hasContentGate ?? false,
        },
      ];
    case 'playbackBlocked': {
      const errName = message.payload?.errName ?? null;
      const actions: PlayerBridgeAction[] = [
        {
          type: 'countMetric',
          name: 'stream.playback_blocked',
          attributes: {
            channel: context.channel ?? 'unknown',
            err_name: errName ?? 'unknown',
          },
        },
      ];
      // AbortError is the player core interrupting our play() while it
      // swaps sources during startup - routine, recovered automatically.
      // Anything else (NotAllowedError, NotSupportedError) means
      // playback could not start and the player is stuck on its first
      // frame; that is the report worth alerting on.
      if (errName !== 'AbortError' && !context.reportedPlaybackBlocked) {
        actions.push(
          { type: 'markPlaybackBlockedReported' },
          {
            type: 'log',
            level: 'warn',
            message: `playback blocked: ${errName ?? 'unknown'}`,
            args: [
              {
                name: 'twitch_player_warning',
                channel: context.channel,
                errName,
                elapsedMs,
              },
            ],
          },
        );
      }
      return actions;
    }
    case 'playbackStalled': {
      if (!message.payload) {
        return [];
      }

      const actions: PlayerBridgeAction[] = [
        {
          type: 'recordPlaybackFreeze',
          stalledMs: message.payload.stalledMs,
        },
        {
          type: 'log',
          level: 'error',
          message: `playback stalled for ${message.payload.stalledMs}ms`,
          args: [
            {
              name: 'twitch_player_error',
              exceptionName: 'StreamPlaybackStalled',
              fingerprint: ['stream-playback-stalled'],
              channel: context.channel,
              ...message.payload,
              elapsedMs,
            },
          ],
        },
      ];
      if (context.enhancedStabilityEnabled) {
        actions.push({ type: 'notifyStability', event: 'stalled' });
      }
      return actions;
    }
    case 'playbackRecovered':
      if (!message.payload) {
        return [];
      }
      return [
        { type: 'notifyStability', event: 'recovered' },
        {
          type: 'countMetric',
          name: 'stream.playback_recovered',
          attributes: {
            channel: context.channel ?? 'unknown',
          },
        },
        {
          type: 'log',
          level: 'info',
          message: 'playback recovered after stall',
          args: [
            {
              name: 'twitch_player_info',
              channel: context.channel,
              ...message.payload,
            },
          ],
        },
      ];
    case 'videoElementError': {
      if (!message.payload) {
        return [];
      }

      const actions: PlayerBridgeAction[] = [
        {
          type: 'log',
          level: 'error',
          message: `video element error code ${message.payload.code ?? 'unknown'}`,
          args: [
            {
              name: 'twitch_player_error',
              exceptionName: 'StreamVideoElementError',
              fingerprint: ['stream-video-element-error'],
              channel: context.channel,
              ...message.payload,
              elapsedMs,
            },
          ],
        },
      ];
      if (context.enhancedStabilityEnabled) {
        actions.push({ type: 'notifyStability', event: 'videoError' });
      }
      return actions;
    }
    case 'twitchAuthComplete':
      return [{ type: 'scheduleAuthCompletionReload' }];
    case 'pipChanged':
      if (!message.payload) {
        return [];
      }
      return [{ type: 'setPipActive', active: message.payload.active }];
    case 'pipUnavailable':
      return [
        {
          type: 'log',
          level: 'warn',
          message: 'picture-in-picture unavailable on this player',
          args: [
            {
              name: 'twitch_player_warning',
              channel: context.channel,
            },
          ],
        },
        { type: 'showPipUnavailableToast' },
      ];
    case 'playbackStats': {
      if (!message.payload) {
        return [];
      }

      const latency = message.payload.hlsLatencyBroadcaster;
      const hasUsableLiveLatency =
        typeof latency === 'number' &&
        Number.isFinite(latency) &&
        latency > 0.25 &&
        latency < 600;

      if (!hasUsableLiveLatency) {
        return [];
      }

      const actions: PlayerBridgeAction[] = [];
      const previousLatency = context.lastPublishedLatencySeconds;
      if (
        previousLatency == null ||
        Math.abs(previousLatency - latency) >= 0.25
      ) {
        actions.push({ type: 'publishLatency', latencySeconds: latency });
      }
      if (context.enhancedStabilityEnabled) {
        actions.push({
          type: 'notifyStabilityLatency',
          latencySeconds: latency,
        });
      }
      return actions;
    }
    case 'muteState': {
      if (!message.payload) {
        return [];
      }

      const { muted, volume } = message.payload;
      const actions: PlayerBridgeAction[] = [
        { type: 'applyMuteState', muted, volume },
      ];
      if (context.deferOverlayUntilUserUnmute && muted === false) {
        actions.push({ type: 'unlockOverlay' });
      }
      return actions;
    }
    default:
      return [];
  }
}
