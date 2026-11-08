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
  | { type: 'notifyStabilityPlaying' }
  | { type: 'notifyStabilityLatency'; latencySeconds: number }
  | { type: 'publishLatency'; latencySeconds: number }
  | { type: 'recordResumeTime'; seconds: number }
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

function interpretPlayerFailureMessage(
  message: PlayerMessage,
  context: PlayerBridgeContext,
  elapsedMs: number,
): PlayerBridgeAction[] {
  switch (message.type) {
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
    case 'embedMisconfigured': {
      const embedParent = message.payload?.parent ?? 'unknown';

      const embedMessage =
        message.payload?.message ?? 'Whoops, this embed is misconfigured';

      const embedErrorMetadata = {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerEmbedMisconfigured',
        fingerprint: ['stream-player-embed-misconfigured'],
        channel: context.channel,
        embedParent,
        elapsedMs,
        message: embedMessage,
      };

      return [
        {
          type: 'recordLoadFailed',
          reason: 'embed_misconfigured',
          error: embedErrorMetadata,
        },
        {
          type: 'countMetric',
          name: 'stream.embed_misconfigured',
          attributes: {
            channel: context.channel ?? 'unknown',
            embed_parent: embedParent,
          },
        },
        {
          type: 'log',
          level: 'warn',
          message: `[StreamPlayer:embed MISCONFIGURED] ${embedMessage}`,
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

      // AbortError is routine, self-recovered startup source-swap noise;
      // anything else means playback could not start and is worth alerting on.
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
    default:
      return [];
  }
}

/**
 * Returns null for a message that is not JSON or not an object.
 */
export function parsePlayerMessage(data: string): PlayerMessage | null {
  try {
    const parsed: unknown = JSON.parse(data);

    // SAFETY: interpretPlayerMessage checks each payload field before it uses it.
    return parsed instanceof Object ? (parsed as PlayerMessage) : null;
  } catch {
    return null;
  }
}

export function interpretPlayerMessage(
  message: PlayerMessage,
  context: PlayerBridgeContext,
): PlayerBridgeAction[] {
  if (!(message instanceof Object)) {
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
        { type: 'notifyStabilityPlaying' },
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
    case 'vodProgress': {
      const seconds = message.payload?.currentTime;

      return Number.isFinite(seconds)
        ? [{ type: 'recordResumeTime', seconds }]
        : [];
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
    case 'error':
    case 'embedMisconfigured':
    case 'contentGateDetected':
    case 'playbackBlocked':
      return interpretPlayerFailureMessage(message, context, elapsedMs);
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
        latency != null &&
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

      if (context.deferOverlayUntilUserUnmute && !muted) {
        actions.push({ type: 'unlockOverlay' });
      }

      return actions;
    }
    default:
      return [];
  }
}
