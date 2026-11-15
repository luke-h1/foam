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

    test('pauses when the user paused', () => {
      const actions = interpretPlayerMessage(
        { type: 'pause' },
        createBridgeContext({ userPaused: true }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'setPaused', isPaused: true },
      ]);
    });

    test('pauses when autoplay is off', () => {
      const actions = interpretPlayerMessage(
        { type: 'pause' },
        createBridgeContext({ autoplay: false }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        { type: 'setPaused', isPaused: true },
      ]);
    });
  });

  describe('stalled', () => {
    test('counts a metric and asks stability to recover when playback is expected', () => {
      expect(
        interpretPlayerMessage(
          { type: 'stalled', payload: { frozenMs: 14_000 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'countMetric',
          name: 'stream.stall_recovery',
          attributes: { channel: 'sodapoppin' },
        },
        { type: 'notifyStabilityStall' },
      ]);
    });

    test('does nothing while the user has paused', () => {
      expect(
        interpretPlayerMessage(
          { type: 'stalled', payload: { frozenMs: 14_000 } },
          createBridgeContext({ userPaused: true }),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('recovers regardless of the enhanced stability preference', () => {
      expect(
        interpretPlayerMessage(
          { type: 'stalled' },
          createBridgeContext({
            channel: undefined,
            enhancedStabilityEnabled: false,
          }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'countMetric',
          name: 'stream.stall_recovery',
          attributes: { channel: 'unknown' },
        },
        { type: 'notifyStabilityStall' },
      ]);
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

  describe('embedMisconfigured', () => {
    test('records a dedicated load failure, metric and log with the bad parent', () => {
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
    test('applies the reported mute state', () => {
      expect(
        interpretPlayerMessage(
          { type: 'muteState', payload: { muted: true, volume: 0.4 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'applyMuteState', muted: true },
      ]);
    });

    test('unlocks the overlay on unmute when the overlay is deferred', () => {
      expect(
        interpretPlayerMessage(
          { type: 'muteState', payload: { muted: false, volume: 1 } },
          createBridgeContext({ deferOverlayUntilUserUnmute: true }),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'applyMuteState', muted: false },
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
        { type: 'applyMuteState', muted: true },
      ]);
    });

    test('does not unlock the overlay when it is not deferred', () => {
      expect(
        interpretPlayerMessage(
          { type: 'muteState', payload: { muted: false, volume: 1 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'applyMuteState', muted: false },
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
    expect(parsePlayerMessage('{"type":"ready"}')).toEqual<PlayerMessage>({
      type: 'ready',
    });
  });

  test('returns null for text that is not JSON', () => {
    expect(parsePlayerMessage('not json')).toBeNull();
  });

  test('returns null for JSON that is not an object', () => {
    expect(parsePlayerMessage('42')).toBeNull();
  });
});
