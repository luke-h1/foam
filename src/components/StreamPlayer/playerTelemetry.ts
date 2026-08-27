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

type PlayerMetricAttributes = {
  autoplay: boolean;
  channel: string;
  content_kind: PlayerContentKind;
  clip?: string;
  video?: string;
};

type PlayerLoadTelemetryAttributes = PlayerMetricAttributes & {
  elapsed_ms: number;
  outcome: 'failed' | 'started' | 'timeout';
  reason?: string;
  start_source?: PlayerPlaybackStartSource;
};

type PlayerErrorMetadata = {
  name: 'twitch_player_error';
  message?: unknown;
};

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
): PlayerMetricAttributes {
  const attributes: PlayerMetricAttributes = {
    autoplay: context.autoplay,
    channel: context.channel ?? 'unknown',
    content_kind: context.contentKind,
  };
  if (context.clip) {
    attributes.clip = context.clip;
  }
  if (context.video) {
    attributes.video = context.video;
  }
  return attributes;
}

function isPlayerErrorMetadata(cause: unknown): cause is PlayerErrorMetadata {
  return (
    cause instanceof Object &&
    'name' in cause &&
    cause.name === 'twitch_player_error'
  );
}

function loadFailureLogMessage(reason: string | undefined, cause: unknown) {
  if (reason === 'embed_error' && isPlayerErrorMetadata(cause)) {
    return `[StreamPlayer:embed ERROR] ${String(cause.message ?? 'Unknown embed error')}`;
  }
  if (reason === 'embed_misconfigured' && isPlayerErrorMetadata(cause)) {
    return `[StreamPlayer:embed MISCONFIGURED] ${String(cause.message ?? 'Whoops, this embed is misconfigured')}`;
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
  cause: unknown,
  telemetryAttrs: PlayerTelemetryMetricAttributes,
) {
  if (isPlayerErrorMetadata(cause)) {
    return {
      ...cause,
      ...telemetryAttrs,
    };
  }

  return {
    name: 'twitch_player_error',
    ...reasonFailureMetadata(reason),
    error: cause,
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

    const telemetryAttrs: PlayerLoadTelemetryAttributes = {
      ...metricAttributes(session.attributes),
      elapsed_ms: details.elapsedMs,
      outcome,
    };
    if (details.startSource) {
      telemetryAttrs.start_source = details.startSource;
    }
    if (details.reason) {
      telemetryAttrs.reason = details.reason;
    }

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

    noteLoadFailed(reason: string, cause?: unknown) {
      if (session && !session.loadFinished && !session.playbackStarted) {
        finishLoad('failed', {
          elapsedMs: Date.now() - session.startedAtMs,
          reason,
          error: cause,
        });
        return;
      }

      // Load already succeeded or was retired, so this is a mid-playback
      // failure: skip the load span/metric but still report it so late
      // WebView/HTTP failures are not silently dropped.
      const context = session?.attributes ?? lastAttributes;
      const telemetryAttrs = context
        ? { ...metricAttributes(context), outcome: 'failed', reason }
        : { outcome: 'failed', reason };
      countMetric('stream.player.late_error', telemetryAttrs);
      logger.main.error(
        loadFailureLogMessage(reason, cause),
        loadFailureLogMetadata(reason, cause, telemetryAttrs),
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
