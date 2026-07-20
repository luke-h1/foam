import type { EventSubscription } from 'expo-modules-core';

export type ImageMemoryPressureEvent = {
  /**
   * ComponentCallbacks2 trim level that fired the signal (Android). Higher is
   * more urgent; see ComponentCallbacks2.TRIM_MEMORY_* constants.
   */
  level: number;
};

export interface ImageMemoryPressureNativeModule {
  /**
   * Bytes of memory remaining before this process hits its memory limit and is
   * jettisoned. On iOS this is os_proc_available_memory; on Android it is the
   * system headroom above the low-memory kill threshold (availMem - threshold),
   * reported as a minimal positive value when at/under the threshold so the
   * poller reads it as critical. Returns 0 only when the native module is
   * unavailable (web, or before the native build ships), which the caller
   * treats as "monitoring disabled".
   */
  getAvailableMemory(): number;

  /**
   * Acute-pressure push signal. Fires on Android when the OS reports
   * onTrimMemory at RUNNING_LOW or worse; absent on iOS (poll-only) and on the
   * unavailable fallback, so callers must null-check before subscribing.
   */
  addListener?(
    eventName: 'onMemoryPressure',
    listener: (event: ImageMemoryPressureEvent) => void,
  ): EventSubscription;
}
