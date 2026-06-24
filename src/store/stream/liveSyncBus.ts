/**
 * Tiny event bus so the chat settings sheet can ask the (sibling) stream player
 * to seek back to the live edge without threading a callback through the whole
 * Chat → overlay tree. The live-stream screen subscribes and forwards to the
 * player ref; the settings button fires it. Mirrors the module-signal approach
 * used for video latency.
 */
type LiveSyncListener = () => void;

const listeners = new Set<LiveSyncListener>();

export function requestLiveSync(): void {
  listeners.forEach(listener => {
    try {
      listener();
    } catch {
      // A failing listener must not stop the others.
    }
  });
}

export function subscribeLiveSync(listener: LiveSyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
