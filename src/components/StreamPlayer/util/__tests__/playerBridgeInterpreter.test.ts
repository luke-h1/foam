import type { PlayerMessage } from '@app/components/StreamPlayer/types';

import type { PlayerBridgeAction } from '../playerBridgeInterpreter';
import { interpretPlayerMessage } from '../playerBridgeInterpreter';
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
              elapsedMs: 2_500,
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
        { type: 'notifyStability', event: 'playing' },
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
              elapsedMs: 2_500,
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
        { type: 'notifyStability', event: 'playing' },
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
        { type: 'notifyStability', event: 'playing' },
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
              channel: undefined,
              elapsedMs: 2_500,
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
          JSON.parse('{"type":"currentTime"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores currentTime when time is missing from the payload', () => {
      expect(
        interpretPlayerMessage(
          JSON.parse('{"type":"currentTime","payload":{}}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores duration when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          JSON.parse('{"type":"duration"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores duration when duration is missing from the payload', () => {
      expect(
        interpretPlayerMessage(
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
    test('records load failure and notifies with the embed error message', () => {
      expect(
        interpretPlayerMessage(
          { type: 'error', payload: { message: 'embed exploded' } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'recordLoadFailed',
          reason: 'embed_error',
          error: {
            name: 'twitch_player_error',
            exceptionName: 'StreamPlayerEmbedError',
            fingerprint: ['stream-player-embed-error'],
            channel: 'sodapoppin',
            elapsedMs: 2_500,
            message: 'embed exploded',
          },
        },
        { type: 'notifyError', message: 'embed exploded' },
      ]);
    });

    test('falls back to a generic message when the payload is missing', () => {
      expect(
        interpretPlayerMessage(
          JSON.parse('{"type":"error"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        {
          type: 'recordLoadFailed',
          reason: 'embed_error',
          error: {
            name: 'twitch_player_error',
            exceptionName: 'StreamPlayerEmbedError',
            fingerprint: ['stream-player-embed-error'],
            channel: 'sodapoppin',
            elapsedMs: 2_500,
            message: 'Unknown embed error',
          },
        },
        { type: 'notifyError', message: 'Unknown embed error' },
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
              elapsedMs: 2_500,
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

  describe('playbackStalled', () => {
    const stalled: PlayerMessage = {
      type: 'playbackStalled',
      payload: {
        currentTime: 10,
        networkState: 2,
        readyState: 2,
        stalledMs: 6000,
      },
    };

    test('logs and notifies stability when enhanced stability is on', () => {
      expect(interpretPlayerMessage(stalled, createBridgeContext())).toEqual<
        PlayerBridgeAction[]
      >([
        {
          type: 'recordPlaybackFreeze',
          stalledMs: 6000,
        },
        {
          type: 'log',
          level: 'error',
          message: 'playback stalled for 6000ms',
          args: [
            {
              name: 'twitch_player_error',
              exceptionName: 'StreamPlaybackStalled',
              fingerprint: ['stream-playback-stalled'],
              channel: 'sodapoppin',
              currentTime: 10,
              networkState: 2,
              readyState: 2,
              stalledMs: 6000,
              elapsedMs: 2_500,
            },
          ],
        },
        { type: 'notifyStability', event: 'stalled' },
      ]);
    });

    test('only logs when enhanced stability is off', () => {
      const actions = interpretPlayerMessage(
        stalled,
        createBridgeContext({ enhancedStabilityEnabled: false }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        {
          type: 'recordPlaybackFreeze',
          stalledMs: 6000,
        },
        {
          type: 'log',
          level: 'error',
          message: 'playback stalled for 6000ms',
          args: [
            {
              name: 'twitch_player_error',
              exceptionName: 'StreamPlaybackStalled',
              fingerprint: ['stream-playback-stalled'],
              channel: 'sodapoppin',
              currentTime: 10,
              networkState: 2,
              readyState: 2,
              stalledMs: 6000,
              elapsedMs: 2_500,
            },
          ],
        },
      ]);
    });

    test('ignores playbackStalled when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          JSON.parse('{"type":"playbackStalled"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });

  describe('playbackRecovered', () => {
    test('notes recovery, counts the metric and logs', () => {
      expect(
        interpretPlayerMessage(
          { type: 'playbackRecovered', payload: { stalledMs: 6000 } },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([
        { type: 'notifyStability', event: 'recovered' },
        {
          type: 'countMetric',
          name: 'stream.playback_recovered',
          attributes: {
            channel: 'sodapoppin',
          },
        },
        {
          type: 'log',
          level: 'info',
          message: 'playback recovered after stall',
          args: [
            {
              name: 'twitch_player_info',
              channel: 'sodapoppin',
              stalledMs: 6000,
            },
          ],
        },
      ]);
    });

    test('ignores playbackRecovered when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          JSON.parse('{"type":"playbackRecovered"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });

  describe('videoElementError', () => {
    const videoError: PlayerMessage = {
      type: 'videoElementError',
      payload: { code: 3, message: 'decode', networkState: 2, readyState: 1 },
    };

    test('logs and notifies stability when enhanced stability is on', () => {
      expect(interpretPlayerMessage(videoError, createBridgeContext())).toEqual<
        PlayerBridgeAction[]
      >([
        {
          type: 'log',
          level: 'error',
          message: 'video element error code 3',
          args: [
            {
              name: 'twitch_player_error',
              exceptionName: 'StreamVideoElementError',
              fingerprint: ['stream-video-element-error'],
              channel: 'sodapoppin',
              code: 3,
              message: 'decode',
              networkState: 2,
              readyState: 1,
              elapsedMs: 2_500,
            },
          ],
        },
        { type: 'notifyStability', event: 'videoError' },
      ]);
    });

    test('only logs when enhanced stability is off', () => {
      const actions = interpretPlayerMessage(
        videoError,
        createBridgeContext({ enhancedStabilityEnabled: false }),
      );

      expect(actions.map(action => action.type)).toEqual(['log']);
    });

    test('labels a missing error code as unknown', () => {
      const actions = interpretPlayerMessage(
        {
          type: 'videoElementError',
          payload: {
            code: null,
            message: 'decode',
            networkState: 2,
            readyState: 1,
          },
        },
        createBridgeContext({ enhancedStabilityEnabled: false }),
      );

      expect(actions).toEqual<PlayerBridgeAction[]>([
        {
          type: 'log',
          level: 'error',
          message: 'video element error code unknown',
          args: [
            {
              name: 'twitch_player_error',
              exceptionName: 'StreamVideoElementError',
              fingerprint: ['stream-video-element-error'],
              channel: 'sodapoppin',
              code: null,
              message: 'decode',
              networkState: 2,
              readyState: 1,
              elapsedMs: 2_500,
            },
          ],
        },
      ]);
    });

    test('ignores videoElementError when payload is missing', () => {
      expect(
        interpretPlayerMessage(
          JSON.parse('{"type":"videoElementError"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
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
        interpretPlayerMessage(statsMessage(NaN), createBridgeContext()),
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
          JSON.parse('null') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores a non-object message', () => {
      expect(
        interpretPlayerMessage(
          JSON.parse('5') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores an object without a known type', () => {
      expect(
        interpretPlayerMessage(
          JSON.parse('{"type":"somethingNew"}') as PlayerMessage,
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });

    test('ignores healthCheck messages', () => {
      expect(
        interpretPlayerMessage(
          {
            type: 'healthCheck',
            payload: {
              currentTime: 1,
              networkState: 1,
              paused: false,
              readyState: 4,
            },
          },
          createBridgeContext(),
        ),
      ).toEqual<PlayerBridgeAction[]>([]);
    });
  });
});
