import type { PlayerMessage } from '@app/components/stream-player/types';

import type { PlayerBridgeAction } from '../playerBridgeInterpreter';
import {
  interpretPlayerMessage,
  parsePlayerMessage,
} from '../playerBridgeInterpreter';
import { createBridgeContext } from './__fixtures__/playerBridgeInterpreter.fixture';

describe('interpretPlayerMessage', () => {
  describe('ready', () => {
    test('reports telemetry, marks the player ready and notifies the caller', () => {
      const actions = interpretPlayerMessage(
        { type: 'ready' },
        createBridgeContext({ deferOverlayUntilUserUnmute: true }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        {
          type: 'countMetric',
          name: 'stream.ready',
          attributes: {
            autoplay: true,
            component: 'StreamPlayer',
            defer_overlay_until_user_unmute: true,
          },
        },
        {
          type: 'log',
          level: 'info',
          message: 'player ready',
          args: [
            {
              name: 'twitch_player_info',
              channel: 'sodapoppin',
              elapsedMs: 2500,
            },
          ],
        },
        { type: 'setPlayerReady' },
        { type: 'notifyReady' },
      ]);
    });
  });

  describe('play', () => {
    test('cancels a pending transient resume and unpauses', () => {
      const actions = interpretPlayerMessage(
        { type: 'play' },
        createBridgeContext(),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'cancelTransientResume' },
        { type: 'setPaused', isPaused: false },
      ]);
    });
  });

  describe('playing', () => {
    test('reports first playing once, unpauses and notifies play', () => {
      const actions = interpretPlayerMessage(
        { type: 'playing' },
        createBridgeContext(),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'cancelTransientResume' },
        { type: 'notifyStabilityPlaying' },
        { type: 'markFirstPlayingReported' },
        { type: 'recordPlaybackStarted', startSource: 'bridge_playing' },
        {
          type: 'countMetric',
          name: 'stream.playing',
          attributes: {
            autoplay: true,
            channel: 'sodapoppin',
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
              channel: 'sodapoppin',
              elapsedMs: 2500,
            },
          ],
        },
        { type: 'setPaused', isPaused: false },
        { type: 'notifyPlay' },
      ]);
    });

    test('skips first-playing telemetry once it has been reported', () => {
      const actions = interpretPlayerMessage(
        { type: 'playing' },
        createBridgeContext({ reportedFirstPlaying: true }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'cancelTransientResume' },
        { type: 'notifyStabilityPlaying' },
        { type: 'setPaused', isPaused: false },
        { type: 'notifyPlay' },
      ]);
    });

    test('falls back to an unknown channel tag when no channel is set', () => {
      expect(
        interpretPlayerMessage(
          { type: 'playing' },
          createBridgeContext({ channel: undefined }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'cancelTransientResume' },
        { type: 'notifyStabilityPlaying' },
        { type: 'markFirstPlayingReported' },
        { type: 'recordPlaybackStarted', startSource: 'bridge_playing' },
        {
          type: 'countMetric',
          name: 'stream.playing',
          attributes: {
            autoplay: true,
            channel: 'unknown',
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
              elapsedMs: 2500,
            },
          ],
        },
        { type: 'setPaused', isPaused: false },
        { type: 'notifyPlay' },
      ]);
    });
  });

  describe('pause', () => {
    test('schedules a transient resume when autoplaying and not user paused', () => {
      const actions = interpretPlayerMessage(
        { type: 'pause' },
        createBridgeContext(),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'scheduleTransientResume' },
      ]);
    });

    test('pauses and notifies when the user paused', () => {
      const actions = interpretPlayerMessage(
        { type: 'pause' },
        createBridgeContext({ userPaused: true }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'setPaused', isPaused: true },
        { type: 'notifyPause' },
      ]);
    });

    test('pauses and notifies when autoplay is off', () => {
      const actions = interpretPlayerMessage(
        { type: 'pause' },
        createBridgeContext({ autoplay: false }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'setPaused', isPaused: true },
        { type: 'notifyPause' },
      ]);
    });
  });

  describe('lifecycle notifications', () => {
    test('ended notifies the caller', () => {
      expect(
        interpretPlayerMessage({ type: 'ended' }, createBridgeContext()),
      ).toEqual<PlayerBridgeAction[]>([{ type: 'notifyEnded' }]);
    });

    test('online notifies the caller', () => {
      expect(
        interpretPlayerMessage({ type: 'online' }, createBridgeContext()),
      ).toEqual<PlayerBridgeAction[]>([{ type: 'notifyOnline' }]);
    });

    test('offline notifies the caller', () => {
      expect(
        interpretPlayerMessage({ type: 'offline' }, createBridgeContext()),
      ).toEqual<PlayerBridgeAction[]>([{ type: 'notifyOffline' }]);
    });
  });

  describe('stateUpdate', () => {
    test('applies status and state as reported when playing', () => {
      const actions = interpretPlayerMessage(
        {
          type: 'stateUpdate',
          payload: {
            isBuffering: false,
            isPaused: false,
            isReady: true,
            muted: true,
            volume: 0.5,
          },
        },
        createBridgeContext(),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'setPlayerStatus', isReady: true, isBuffering: false },
        {
          type: 'applyStateUpdate',
          isPaused: false,
          muted: true,
          volume: 0.5,
        },
      ]);
    });

    test('treats an autoplay pause as transient and keeps state unpaused', () => {
      const actions = interpretPlayerMessage(
        {
          type: 'stateUpdate',
          payload: {
            isBuffering: false,
            isPaused: true,
            isReady: true,
            muted: false,
            volume: 1,
          },
        },
        createBridgeContext(),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'setPlayerStatus', isReady: true, isBuffering: false },
        { type: 'scheduleTransientResume' },
        {
          type: 'applyStateUpdate',
          isPaused: false,
          muted: false,
          volume: 1,
        },
      ]);
    });

    test('keeps a user pause paused', () => {
      const actions = interpretPlayerMessage(
        {
          type: 'stateUpdate',
          payload: {
            isBuffering: true,
            isPaused: true,
            isReady: true,
            muted: false,
            volume: 1,
          },
        },
        createBridgeContext({ userPaused: true }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'setPlayerStatus', isReady: true, isBuffering: true },
        {
          type: 'applyStateUpdate',
          isPaused: true,
          muted: false,
          volume: 1,
        },
      ]);
    });

    test('ignores a stateUpdate message without a payload', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"stateUpdate"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });

  describe('time queries', () => {
    test('currentTime resolves the pending current-time request', () => {
      expect(
        interpretPlayerMessage(
          { type: 'currentTime', payload: { time: 42.5 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'resolveCurrentTime', seconds: 42.5 },
      ]);
    });

    test('duration resolves the pending duration request', () => {
      expect(
        interpretPlayerMessage(
          { type: 'duration', payload: { duration: 3600 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'resolveDuration', seconds: 3600 },
      ]);
    });

    test('ignores currentTime when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"currentTime"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores currentTime when time is missing from the payload', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"currentTime","payload":{}}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores duration when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"duration"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores duration when duration is missing from the payload', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"duration","payload":{}}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });

  describe('trace', () => {
    test('logs the embed step and detail', () => {
      expect(
        interpretPlayerMessage(
          { type: 'trace', payload: { step: 'boot', detail: 'starting' } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'log',
          level: 'debug',
          message: '[StreamPlayer:embed]',
          args: ['boot', 'starting'],
        },
      ]);
    });

    test('falls back to placeholders when the payload is missing fields', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"trace"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'log',
          level: 'debug',
          message: '[StreamPlayer:embed]',
          args: ['?', ''],
        },
      ]);
    });
  });

  describe('error', () => {
    test('records load failure, logs and notifies with the embed error message', () => {
      const embedErrorMetadata = {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerEmbedError',
        fingerprint: ['stream-player-embed-error'],
        channel: 'sodapoppin',
        elapsedMs: 2500,
        message: 'embed exploded',
      };

      expect(
        interpretPlayerMessage(
          { type: 'error', payload: { message: 'embed exploded' } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'recordLoadFailed',
          reason: 'embed_error',
          error: embedErrorMetadata,
        },
        {
          type: 'log',
          level: 'warn',
          message: '[StreamPlayer:embed ERROR] embed exploded',
          args: [embedErrorMetadata],
        },
        { type: 'notifyError', message: 'embed exploded' },
      ]);
    });

    test('falls back to a generic message when the payload is missing', () => {
      const embedErrorMetadata = {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerEmbedError',
        fingerprint: ['stream-player-embed-error'],
        channel: 'sodapoppin',
        elapsedMs: 2500,
        message: 'Unknown embed error',
      };

      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"error"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'recordLoadFailed',
          reason: 'embed_error',
          error: embedErrorMetadata,
        },
        {
          type: 'log',
          level: 'warn',
          message: '[StreamPlayer:embed ERROR] Unknown embed error',
          args: [embedErrorMetadata],
        },
        { type: 'notifyError', message: 'Unknown embed error' },
      ]);
    });
  });

  describe('embedMisconfigured', () => {
    test('records a dedicated load failure, metric, log and notify with the bad parent', () => {
      const embedErrorMetadata = {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerEmbedMisconfigured',
        fingerprint: ['stream-player-embed-misconfigured'],
        channel: 'sodapoppin',
        embedParent: '',
        elapsedMs: 2500,
        message: 'Whoops, this embed is misconfigured',
      };

      expect(
        interpretPlayerMessage(
          {
            type: 'embedMisconfigured',
            payload: {
              message: 'Whoops, this embed is misconfigured',
              parent: '',
            },
          },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'recordLoadFailed',
          reason: 'embed_misconfigured',
          error: embedErrorMetadata,
        },
        {
          type: 'countMetric',
          name: 'stream.embed_misconfigured',
          attributes: {
            channel: 'sodapoppin',
            embed_parent: '',
          },
        },
        {
          type: 'log',
          level: 'warn',
          message:
            '[StreamPlayer:embed MISCONFIGURED] Whoops, this embed is misconfigured',
          args: [embedErrorMetadata],
        },
        {
          type: 'notifyError',
          message: 'Whoops, this embed is misconfigured',
        },
      ]);
    });

    test('falls back to unknown parent and a generic message when the payload is missing', () => {
      const embedErrorMetadata = {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerEmbedMisconfigured',
        fingerprint: ['stream-player-embed-misconfigured'],
        channel: 'sodapoppin',
        embedParent: 'unknown',
        elapsedMs: 2500,
        message: 'Whoops, this embed is misconfigured',
      };

      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"embedMisconfigured"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'recordLoadFailed',
          reason: 'embed_misconfigured',
          error: embedErrorMetadata,
        },
        {
          type: 'countMetric',
          name: 'stream.embed_misconfigured',
          attributes: {
            channel: 'sodapoppin',
            embed_parent: 'unknown',
          },
        },
        {
          type: 'log',
          level: 'warn',
          message:
            '[StreamPlayer:embed MISCONFIGURED] Whoops, this embed is misconfigured',
          args: [embedErrorMetadata],
        },
        {
          type: 'notifyError',
          message: 'Whoops, this embed is misconfigured',
        },
      ]);
    });
  });

  describe('contentGateDetected', () => {
    test('propagates the gate flag', () => {
      expect(
        interpretPlayerMessage(
          { type: 'contentGateDetected', payload: { hasContentGate: true } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'setContentGate', hasContentGate: true },
      ]);
    });

    test('defaults to no gate when the payload is missing', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"contentGateDetected"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'setContentGate', hasContentGate: false },
      ]);
    });
  });

  describe('playbackBlocked', () => {
    test('only counts the metric for a routine AbortError', () => {
      expect(
        interpretPlayerMessage(
          { type: 'playbackBlocked', payload: { errName: 'AbortError' } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'countMetric',
          name: 'stream.playback_blocked',
          attributes: {
            channel: 'sodapoppin',
            err_name: 'AbortError',
          },
        },
      ]);
    });

    test('reports a fatal block once', () => {
      expect(
        interpretPlayerMessage(
          { type: 'playbackBlocked', payload: { errName: 'NotAllowedError' } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'countMetric',
          name: 'stream.playback_blocked',
          attributes: {
            channel: 'sodapoppin',
            err_name: 'NotAllowedError',
          },
        },
        { type: 'markPlaybackBlockedReported' },
        {
          type: 'log',
          level: 'warn',
          message: 'playback blocked: NotAllowedError',
          args: [
            {
              name: 'twitch_player_warning',
              channel: 'sodapoppin',
              errName: 'NotAllowedError',
              elapsedMs: 2500,
            },
          ],
        },
      ]);
    });

    test('skips the warning once a block has been reported this generation', () => {
      expect(
        interpretPlayerMessage(
          { type: 'playbackBlocked', payload: { errName: 'NotAllowedError' } },
          createBridgeContext({ reportedPlaybackBlocked: true }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'countMetric',
          name: 'stream.playback_blocked',
          attributes: {
            channel: 'sodapoppin',
            err_name: 'NotAllowedError',
          },
        },
      ]);
    });

    test('tags a missing error name as unknown', () => {
      expect(
        interpretPlayerMessage(
          { type: 'playbackBlocked', payload: { errName: null } },
          createBridgeContext({ reportedPlaybackBlocked: true }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'countMetric',
          name: 'stream.playback_blocked',
          attributes: {
            channel: 'sodapoppin',
            err_name: 'unknown',
          },
        },
      ]);
    });
  });

  describe('twitchAuthComplete', () => {
    test('schedules the auth completion reload', () => {
      expect(
        interpretPlayerMessage(
          { type: 'twitchAuthComplete' },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'scheduleAuthCompletionReload' },
      ]);
    });
  });

  describe('pipChanged', () => {
    test('propagates the picture-in-picture active flag', () => {
      expect(
        interpretPlayerMessage(
          { type: 'pipChanged', payload: { active: true } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([{ type: 'setPipActive', active: true }]);
    });

    test('ignores pipChanged when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"pipChanged"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });

  describe('pipUnavailable', () => {
    test('logs and surfaces the unavailable toast', () => {
      expect(
        interpretPlayerMessage(
          { type: 'pipUnavailable' },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'log',
          level: 'warn',
          message: 'picture-in-picture unavailable on this player',
          args: [
            {
              name: 'twitch_player_warning',
              channel: 'sodapoppin',
            },
          ],
        },
        { type: 'showPipUnavailableToast' },
      ]);
    });
  });

  describe('playbackStats', () => {
    function statsMessage(hlsLatencyBroadcaster: number | null): PlayerMessage {
      return { type: 'playbackStats', payload: { hlsLatencyBroadcaster } };
    }

    test('publishes the first usable latency and notifies stability', () => {
      expect(
        interpretPlayerMessage(statsMessage(4.2), createBridgeContext()),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'publishLatency', latencySeconds: 4.2 },
        { type: 'notifyStabilityLatency', latencySeconds: 4.2 },
      ]);
    });

    test('suppresses publishing when the change is below the 0.25s threshold', () => {
      expect(
        interpretPlayerMessage(
          statsMessage(4.3),
          createBridgeContext({ lastPublishedLatencySeconds: 4.2 }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'notifyStabilityLatency', latencySeconds: 4.3 },
      ]);
    });

    test('publishes again once the change reaches the threshold', () => {
      expect(
        interpretPlayerMessage(
          statsMessage(4.45),
          createBridgeContext({ lastPublishedLatencySeconds: 4.2 }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'publishLatency', latencySeconds: 4.45 },
        { type: 'notifyStabilityLatency', latencySeconds: 4.45 },
      ]);
    });

    test('skips stability when enhanced stability is off', () => {
      expect(
        interpretPlayerMessage(
          statsMessage(4.2),
          createBridgeContext({ enhancedStabilityEnabled: false }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'publishLatency', latencySeconds: 4.2 },
      ]);
    });

    test('ignores latencies at or below the lower bound', () => {
      expect(
        interpretPlayerMessage(statsMessage(0.25), createBridgeContext()),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores latencies at or above the upper bound', () => {
      expect(
        interpretPlayerMessage(statsMessage(600), createBridgeContext()),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores a null latency', () => {
      expect(
        interpretPlayerMessage(statsMessage(null), createBridgeContext()),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores a non-finite latency', () => {
      expect(
        interpretPlayerMessage(statsMessage(Number.NaN), createBridgeContext()),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores stats without a latency field', () => {
      expect(
        interpretPlayerMessage(
          { type: 'playbackStats', payload: { fps: 60 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores playbackStats when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"playbackStats"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });

  describe('muteState', () => {
    test('applies the reported mute and volume', () => {
      expect(
        interpretPlayerMessage(
          { type: 'muteState', payload: { muted: true, volume: 0.4 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'applyMuteState', muted: true, volume: 0.4 },
      ]);
    });

    test('unlocks the overlay on unmute when the overlay is deferred', () => {
      expect(
        interpretPlayerMessage(
          { type: 'muteState', payload: { muted: false, volume: 1 } },
          createBridgeContext({ deferOverlayUntilUserUnmute: true }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'applyMuteState', muted: false, volume: 1 },
        { type: 'unlockOverlay' },
      ]);
    });

    test('does not unlock the overlay while still muted', () => {
      expect(
        interpretPlayerMessage(
          { type: 'muteState', payload: { muted: true, volume: 1 } },
          createBridgeContext({ deferOverlayUntilUserUnmute: true }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'applyMuteState', muted: true, volume: 1 },
      ]);
    });

    test('does not unlock the overlay when it is not deferred', () => {
      expect(
        interpretPlayerMessage(
          { type: 'muteState', payload: { muted: false, volume: 1 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'applyMuteState', muted: false, volume: 1 },
      ]);
    });

    test('ignores muteState when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"muteState"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });

  describe('malformed and unknown messages', () => {
    test('ignores a null message', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('null') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores a non-object message', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('5') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores an object without a known type', () => {
      expect(
        interpretPlayerMessage(
          // SAFETY: intentionally malformed wire message to exercise the runtime payload guard
          JSON.parse('{"type":"somethingNew"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });

  describe('vodProgress', () => {
    test('records the VOD position for the next reload', () => {
      const actions = interpretPlayerMessage(
        { type: 'vodProgress', payload: { currentTime: 93.5 } },
        createBridgeContext(),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'recordResumeTime', seconds: 93.5 },
      ]);
    });

    test('ignores a position that is not a finite number', () => {
      const actions = interpretPlayerMessage(
        parsePlayerMessage('{"type":"vodProgress","payload":{}}') ?? {
          type: 'ready',
        },
        createBridgeContext(),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([]);
    });
  });
});

describe('parsePlayerMessage', () => {
  test('parses a JSON object', () => {
    expect(parsePlayerMessage('{"type":"ended"}')).toEqual<PlayerMessage>({
      type: 'ended',
    });
  });

  test('returns null for text that is not JSON', () => {
    expect(parsePlayerMessage('not json')).toBeNull();
  });

  test('returns null for JSON that is not an object', () => {
    expect(parsePlayerMessage('42')).toBeNull();
  });
});
