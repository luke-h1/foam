interface IdleTask {
  cancel: () => void;
}

export function runWhenIdle(callback: () => void): IdleTask {
  const scheduleIdle = globalThis.requestIdleCallback;
  const cancelIdle = globalThis.cancelIdleCallback;

  if (scheduleIdle && cancelIdle) {
    const handle = scheduleIdle(callback);

    return {
      cancel: () => {
        cancelIdle(handle);
      },
    };
  }

  const handle = setTimeout(callback, 0);

  return {
    cancel: () => {
      clearTimeout(handle);
    },
  };
}
