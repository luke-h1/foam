import {
  countMetric,
  endSpan,
  type Span,
  startInactiveSpan,
} from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

/**
 * Load failure if playback never starts; kept in sync with
 * {@link StreamPlayer} poster safety dismissal.
 */
export const PLAYER_LOAD_TIMEOUT_MS = 9_000;

export type PlayerContentKind = 'clip' | 'live' | 'vod';

export type PlayerPlaybackStartSource = 'bridge_playing' | 'webview_loaded';

export interface PlayerTelemetryContext {
  autoplay: boolean;
  channel?: string;
  clip?: string;
  contentKind: PlayerContentKind;
  video?: string;
}

export type PlayerTelemetryMetricAttributes = Record<
  string,
  string | number | boolean
>;

interface ActiveLoadSession {
  attributes: PlayerTelemetryContext;
  loadFinished: boolean;
  playbackStarted: boolean;
  span: Span | undefined;
  startedAtMs: number;
  timeoutHandle: ReturnType<typeof setTimeout> | null;
}

function metricAttributes(
  context: PlayerTelemetryContext,
): Record<string, string | boolean> {
  return {
    autoplay: context.autoplay,
    channel: context.channel ?? 'unknown',
    content_kind: context.contentKind,
    ...(context.clip ? { clip: context.clip } : {}),
    ...(context.video ? { video: context.video } : {}),
  };
}

function isPlayerErrorMetadata(
  error: unknown,
): error is Record<string, unknown> & { name: 'twitch_player_error' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'twitch_player_error'
  );
}

function loadFailureLogMessage(reason: string | undefined, error: unknown) {
  if (reason === 'embed_error' && isPlayerErrorMetadata(error)) {
    return `[StreamPlayer:embed ERROR] ${String(error.message ?? 'Unknown embed error')}`;
  }
  if (reason === 'load_timeout') {
    return `player failed to load within ${PLAYER_LOAD_TIMEOUT_MS}ms`;
  }
  return `player failed to load: ${reason ?? 'unknown'}`;
}

function reasonFailureMetadata(reason: string | undefined) {
  if (reason === 'webview_error') {
    return {
      exceptionName: 'StreamPlayerWebViewError',
      fingerprint: ['stream-player-webview-error'],
    };
  }
  if (reason?.startsWith('http_')) {
    return {
      exceptionName: 'StreamPlayerHttpError',
      fingerprint: ['stream-player-http-error'],
    };
  }
  if (reason === 'load_timeout') {
    return {
      exceptionName: 'StreamPlayerLoadTimeout',
      fingerprint: ['stream-player-load-timeout'],
    };
  }
  return {
    exceptionName: 'StreamPlayerLoadFailed',
    fingerprint: ['stream-player-load-failed'],
  };
}

function loadFailureLogMetadata(
  reason: string | undefined,
  error: unknown,
  telemetryAttrs: PlayerTelemetryMetricAttributes,
) {
  if (isPlayerErrorMetadata(error)) {
    return {
      ...error,
      ...telemetryAttrs,
    };
  }

  return {
    name: 'twitch_player_error',
    ...reasonFailureMetadata(reason),
    error,
    ...telemetryAttrs,
  };
}

export function createPlayerTelemetry() {
  let session: ActiveLoadSession | null = null;
  let lastAttributes: PlayerTelemetryContext | null = null;

  function clearLoadTimeout() {
    if (session?.timeoutHandle) {
      clearTimeout(session.timeoutHandle);
      session.timeoutHandle = null;
    }
  }

  function cancelActiveSession() {
    if (!session || session.loadFinished) {
      return;
    }
    session.loadFinished = true;
    clearLoadTimeout();
    endSpan(session.span, 'cancelled');
    session = null;
  }

  function finishLoad(
    outcome: 'failed' | 'started' | 'timeout',
    details: {
      elapsedMs: number;
      error?: unknown;
      reason?: string;
      startSource?: PlayerPlaybackStartSource;
    },
  ) {
    if (!session || session.loadFinished) {
      return;
    }

    session.loadFinished = true;
    clearLoadTimeout();

    const attrs = metricAttributes(session.attributes);
    const telemetryAttrs: PlayerTelemetryMetricAttributes = {
      ...attrs,
      elapsed_ms: details.elapsedMs,
      outcome,
      ...(details.startSource ? { start_source: details.startSource } : {}),
      ...(details.reason ? { reason: details.reason } : {}),
    };

    if (outcome === 'started') {
      countMetric('stream.player.start', telemetryAttrs);
      endSpan(session.span, 'ok');
    } else {
      countMetric('stream.player.load_failed', telemetryAttrs);
      endSpan(session.span, 'error');
      logger.main.error(
        loadFailureLogMessage(details.reason, details.error),
        loadFailureLogMetadata(details.reason, details.error, telemetryAttrs),
      );
    }

    session = null;
  }

  return {
    beginLoad(attributes: PlayerTelemetryContext) {
      cancelActiveSession();
      lastAttributes = attributes;

      const startedAtMs = Date.now();
      session = {
        attributes,
        loadFinished: false,
        playbackStarted: false,
        span: startInactiveSpan(
          'stream.player.load',
          'media.load',
          metricAttributes(attributes),
        ),
        startedAtMs,
        timeoutHandle: setTimeout(() => {
          if (session && !session.playbackStarted && !session.loadFinished) {
            finishLoad('timeout', {
              elapsedMs: Date.now() - session.startedAtMs,
              reason: 'load_timeout',
            });
          }
        }, PLAYER_LOAD_TIMEOUT_MS),
      };
    },

    notePlaybackStarted(startSource: PlayerPlaybackStartSource) {
      if (!session || session.playbackStarted || session.loadFinished) {
        return;
      }
      session.playbackStarted = true;
      finishLoad('started', {
        elapsedMs: Date.now() - session.startedAtMs,
        startSource,
      });
    },

    noteLoadFailed(reason: string, error?: unknown) {
      if (session && !session.loadFinished && !session.playbackStarted) {
        finishLoad('failed', {
          elapsedMs: Date.now() - session.startedAtMs,
          reason,
          error,
        });
        return;
      }

      // The load already succeeded or was retired, so this is a mid-playback
      // failure rather than a load failure - skip the load span/metric but
      // still surface the error so late WebView/HTTP failures are not silently
      // dropped from telemetry.
      const context = session?.attributes ?? lastAttributes;
      const telemetryAttrs: PlayerTelemetryMetricAttributes = {
        ...(context ? metricAttributes(context) : {}),
        outcome: 'failed',
        reason,
      };
      countMetric('stream.player.late_error', telemetryAttrs);
      logger.main.error(
        loadFailureLogMessage(reason, error),
        loadFailureLogMetadata(reason, error, telemetryAttrs),
      );
    },

    noteFreeze(payload: Record<string, string | number | boolean>) {
      const context = session?.attributes ??
        lastAttributes ?? {
          autoplay: true,
          contentKind: 'live' as const,
        };
      countMetric('stream.player.freeze', {
        ...metricAttributes(context),
        ...payload,
      });
    },

    dispose() {
      cancelActiveSession();
    },
  };
}

export type PlayerTelemetry = ReturnType<typeof createPlayerTelemetry>;
