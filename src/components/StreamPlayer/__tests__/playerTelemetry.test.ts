import {
  createPlayerTelemetry,
  PLAYER_LOAD_TIMEOUT_MS,
} from '../playerTelemetry';
import { basePlayerTelemetryContext } from './__fixtures__/playerTelemetry.fixture';

jest.mock('@app/lib/sentry', () => ({
  countMetric: jest.fn(),
  endSpan: jest.fn(),
  startInactiveSpan: jest.fn(() => ({ id: 'span-1' })),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    main: {
      info: jest.fn(),
      error: jest.fn(),
    },
  },
}));

const { countMetric, endSpan, startInactiveSpan } =
  jest.requireMock<typeof import('@app/lib/sentry')>('@app/lib/sentry');
const { logger } =
  jest.requireMock<typeof import('@app/utils/logger')>('@app/utils/logger');

describe('createPlayerTelemetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);
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

    jest.setSystemTime(1_500);
    telemetry.notePlaybackStarted('bridge_playing');

    expect(countMetric).toHaveBeenCalledWith('stream.player.start', {
      autoplay: true,
      channel: 'sodapoppin',
      content_kind: 'live',
      elapsed_ms: 500,
      outcome: 'started',
      start_source: 'bridge_playing',
    });
    expect(endSpan).toHaveBeenCalledWith({ id: 'span-1' }, 'ok');
    expect(logger.main.info).not.toHaveBeenCalled();
  });

  test('records a webview load failure with webview-specific metadata', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);
    const loadError = new Error('network down');

    jest.setSystemTime(1_250);
    telemetry.noteLoadFailed('webview_error', loadError);

    expect(countMetric).toHaveBeenCalledWith('stream.player.load_failed', {
      autoplay: true,
      channel: 'sodapoppin',
      content_kind: 'live',
      elapsed_ms: 250,
      outcome: 'failed',
      reason: 'webview_error',
    });
    expect(endSpan).toHaveBeenCalledWith({ id: 'span-1' }, 'error');
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
      elapsedMs: 2_500,
      message: 'embed exploded',
    };

    jest.setSystemTime(1_100);
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

    jest.advanceTimersByTime(PLAYER_LOAD_TIMEOUT_MS);

    expect(countMetric).toHaveBeenCalledWith('stream.player.load_failed', {
      autoplay: true,
      channel: 'sodapoppin',
      content_kind: 'live',
      elapsed_ms: PLAYER_LOAD_TIMEOUT_MS,
      outcome: 'timeout',
      reason: 'load_timeout',
    });
    expect(logger.main.error).toHaveBeenCalledWith(
      `player failed to load within ${PLAYER_LOAD_TIMEOUT_MS}ms`,
      {
        name: 'twitch_player_error',
        exceptionName: 'StreamPlayerLoadTimeout',
        fingerprint: ['stream-player-load-timeout'],
        autoplay: true,
        channel: 'sodapoppin',
        content_kind: 'live',
        elapsed_ms: PLAYER_LOAD_TIMEOUT_MS,
        outcome: 'timeout',
        reason: 'load_timeout',
      },
    );
  });

  test('ignores load failures after playback has started', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);
    telemetry.notePlaybackStarted('webview_loaded');

    jest.clearAllMocks();
    telemetry.noteLoadFailed('embed_error');

    expect(countMetric).not.toHaveBeenCalled();
    expect(logger.main.error).not.toHaveBeenCalled();
  });

  test('counts freeze events with stall duration', () => {
    const telemetry = createPlayerTelemetry();
    telemetry.beginLoad(basePlayerTelemetryContext);

    telemetry.noteFreeze({ stalled_ms: 6000 });

    expect(countMetric).toHaveBeenCalledWith('stream.player.freeze', {
      autoplay: true,
      channel: 'sodapoppin',
      content_kind: 'live',
      stalled_ms: 6000,
    });
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
