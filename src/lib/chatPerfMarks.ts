import performance from 'react-native-performance';

/**
 * Stage timing for the chat ingest pipeline, off by default and enableable in
 * a release build with EXPO_PUBLIC_PERF_MARKS=1 (metro inlines the literal,
 * so disabled builds ship no-ops and none of this module's state). Emits
 * user-timing marks per stage plus one `chat.ingest_to_commit` measure per
 * commit batch spanning oldest-buffered -> committed, readable from a
 * PerformanceObserver, the Rozenite performance panel, or Instruments /
 * Perfetto alongside the existing signposts.
 */
const ENABLED = process.env.EXPO_PUBLIC_PERF_MARKS === '1';

/**
 * Enqueue timestamps for not-yet-committed messages; capped so a stalled
 * commit path can't grow it unbounded (matches the ingest buffer cap).
 */
const MAX_PENDING_TIMESTAMPS = 1024;
const pendingBufferedAt: number[] = [];

function markLineReceived(): void {
  performance.mark('chat.line_received');
}

function markBuffered(): void {
  if (pendingBufferedAt.length < MAX_PENDING_TIMESTAMPS) {
    pendingBufferedAt.push(performance.now());
  }
  performance.mark('chat.buffered');
}

function markDrained(count: number): void {
  performance.mark('chat.drained', { detail: { count } });
}

function markCommitted(count: number): void {
  performance.mark('chat.committed', { detail: { count } });
  if (count <= 0 || pendingBufferedAt.length === 0) {
    return;
  }
  const oldest = pendingBufferedAt[0] ?? 0;
  pendingBufferedAt.splice(0, count);
  try {
    performance.measure('chat.ingest_to_commit', {
      start: oldest,
      end: performance.now(),
      detail: { count },
    });
  } catch {
    // user-timing options unsupported on this platform build - marks suffice
  }
}

function markChannelReset(): void {
  pendingBufferedAt.length = 0;
}

const noop = (): void => {};

type ChatPerfMarks = {
  lineReceived: () => void;
  buffered: () => void;
  drained: (count: number) => void;
  committed: (count: number) => void;
  channelReset: () => void;
};

export const chatPerfMarks: ChatPerfMarks = ENABLED
  ? {
      lineReceived: markLineReceived,
      buffered: markBuffered,
      drained: markDrained,
      committed: markCommitted,
      channelReset: markChannelReset,
    }
  : {
      lineReceived: noop,
      buffered: noop,
      drained: noop,
      committed: noop,
      channelReset: noop,
    };
