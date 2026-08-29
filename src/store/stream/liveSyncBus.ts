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
