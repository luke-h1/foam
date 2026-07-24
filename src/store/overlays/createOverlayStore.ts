type Listener = () => void;

export function createOverlayStore<T>() {
  let state: T | null = null;
  const listeners = new Set<Listener>();

  const emit = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    dismiss() {
      if (state === null) {
        return;
      }
      state = null;
      emit();
    },
    getState() {
      return state;
    },
    present(value: T) {
      state = value;
      emit();
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function createAwaitableOverlayStore<T>() {
  const store = createOverlayStore<T>();
  let resolvePresent: (() => void) | null = null;
  let pending: Promise<void> | null = null;

  return {
    dismiss() {
      const resolve = resolvePresent;
      resolvePresent = null;
      pending = null;
      store.dismiss();
      resolve?.();
    },
    getState: store.getState,
    present(value: T) {
      if (pending) {
        return pending;
      }
      const promise = new Promise<void>(resolve => {
        resolvePresent = resolve;
      });
      pending = promise;
      store.present(value);
      return promise;
    },
    subscribe: store.subscribe,
  };
}
