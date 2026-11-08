import * as sentry from '@app/lib/sentry';
import { silenceLogger } from '@app/test/silence-logger';
import { logger } from '@app/utils/logger';

import { createPlayerTelemetry } from '../util/playerTelemetry';
import { basePlayerTelemetryContext } from './__fixtures__/playerTelemetry.fixture';

function createFakeSpan(id: string): sentry.Span & { id: string } {
  return {
    id,
    spanContext: () => ({ traceId: id, spanId: id, traceFlags: 1 }),
    end: () => undefined,
    setAttribute() {
      return this;
    },
    setAttributes() {
      return this;
    },
    setStatus() {
      return this;
    },
    updateName() {
      return this;
    },
    isRecording: () => true,
    addEvent() {
      return this;
    },
    addLink() {
      return this;
    },
    addLinks() {
      return this;
    },
    recordException: () => undefined,
  };
}

const countMetric = jest
  .spyOn(sentry, 'countMetric')
  .mockImplementation(() => {});

const endSpan = jest.spyOn(sentry, 'endSpan').mockImplementation(() => {});
const fakeSpan = createFakeSpan('span-1');

const startInactiveSpan = jest
  .spyOn(sentry, 'startInactiveSpan')
  .mockImplementation(() => fakeSpan);

silenceLogger();

describe('createPlayerTelemetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('starts a load span when a session begins', () => {
    const telemetry = createPlayerTelemetry();

    telemetry.beginLoad(basePlayerTelemetryContext);

    expect(startInactiveSpan).toHaveBeenCalledWith(
      'stream.player.load',
      'media.load',
      {
        autoplay: true,
        channel: 'sodapoppin',
        content_kind: 'live',
      },
    );
  });

  test('records a start metric and closes the span when playback begins', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);

    jest.setSystemTime(1500);
    telemetry.notePlaybackStarted('bridge_playing');

    expect(countMetric).toHaveBeenCalledWith('stream.player.start', {
      autoplay: true,
      channel: 'sodapoppin',
      content_kind: 'live',
      elapsed_ms: 500,
      outcome: 'started',
      start_source: 'bridge_playing',
    });

    expect(endSpan).toHaveBeenCalledWith(fakeSpan, 'ok');

    expect(logger.main.info).not.toHaveBeenCalled();
  });

  test('records a webview load failure with webview-specific metadata', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);
    const loadError = new Error('network down');

    jest.setSystemTime(1250);
    telemetry.noteLoadFailed('webview_error', loadError);

    expect(countMetric).toHaveBeenCalledWith('stream.player.load_failed', {
      autoplay: true,
      channel: 'sodapoppin',
      content_kind: 'live',
      elapsed_ms: 250,
      outcome: 'failed',
      reason: 'webview_error',
    });

    expect(endSpan).toHaveBeenCalledWith(fakeSpan, 'error');

    expect(logger.main.error).toHaveBeenCalledWith(
      'player failed to load: webview_error',
      {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerWebViewError',
        fingerprint: ['stream-player-webview-error'],
        error: loadError,
        autoplay: true,
        channel: 'sodapoppin',
        content_kind: 'live',
        elapsed_ms: 250,
        outcome: 'failed',
        reason: 'webview_error',
      },
    );
  });

  test('records an embed load failure using structured embed metadata', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);

    const embedError = {
      name: 'twitch_player_error' as const,
      exceptionName: 'StreamPlayerEmbedError',
      fingerprint: ['stream-player-embed-error'],
      channel: 'sodapoppin',
      elapsedMs: 2500,
      message: 'embed exploded',
    };

    jest.setSystemTime(1100);
    telemetry.noteLoadFailed('embed_error', embedError);

    expect(logger.main.error).toHaveBeenCalledWith(
      '[StreamPlayer:embed ERROR] embed exploded',
      {
        ...embedError,
        autoplay: true,
        channel: 'sodapoppin',
        content_kind: 'live',
        elapsed_ms: 100,
        outcome: 'failed',
        reason: 'embed_error',
      },
    );
  });

  test('records a timeout when playback never starts', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);

    jest.advanceTimersByTime(9000);

    expect(countMetric).toHaveBeenCalledWith('stream.player.load_failed', {
      autoplay: true,
      channel: 'sodapoppin',
      content_kind: 'live',
      elapsed_ms: 9000,
      outcome: 'timeout',
      reason: 'load_timeout',
    });

    expect(logger.main.error).toHaveBeenCalledWith(
      'player failed to load within 9000ms',
      {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerLoadTimeout',
        fingerprint: ['stream-player-load-timeout'],
        autoplay: true,
        channel: 'sodapoppin',
        content_kind: 'live',
        elapsed_ms: 9000,
        outcome: 'timeout',
        reason: 'load_timeout',
      },
    );
  });

  test('logs a late error without a load metric after playback has started', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);
    telemetry.notePlaybackStarted('webview_loaded');

    jest.clearAllMocks();
    const lateError = new Error('network down mid-playback');
    telemetry.noteLoadFailed('webview_error', lateError);

    expect(countMetric.mock.calls).toEqual([
      [
        'stream.player.late_error',
        {
          autoplay: true,
          channel: 'sodapoppin',
          content_kind: 'live',
          outcome: 'failed',
          reason: 'webview_error',
        },
      ],
    ]);

    expect(endSpan).not.toHaveBeenCalled();

    expect(logger.main.error).toHaveBeenCalledWith(
      'player failed to load: webview_error',
      {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerWebViewError',
        fingerprint: ['stream-player-webview-error'],
        error: lateError,
        autoplay: true,
        channel: 'sodapoppin',
        content_kind: 'live',
        outcome: 'failed',
        reason: 'webview_error',
      },
    );
  });

  test('only records playback start once per load session', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);

    telemetry.notePlaybackStarted('bridge_playing');
    jest.clearAllMocks();
    telemetry.notePlaybackStarted('webview_loaded');

    expect(countMetric).not.toHaveBeenCalled();

    expect(endSpan).not.toHaveBeenCalled();
  });
});
