/**
 * Event bus so the chat settings sheet can ask the sibling stream player to
 * seek to the live edge without threading a callback through the overlay tree.
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
