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
   * Bytes remaining before this process hits its memory limit: iOS
   * os_proc_available_memory, Android availMem - threshold (minimal positive
   * value when at/under the threshold). 0 only when the native module is
   * unavailable, which callers treat as "monitoring disabled".
   */
  getAvailableMemory(): number;

  /**
   * Fires on Android at onTrimMemory RUNNING_LOW or worse; absent on iOS and
   * the unavailable fallback, so callers must null-check before subscribing.
   */
  addListener?(
    eventName: 'onMemoryPressure',
    listener: (event: ImageMemoryPressureEvent) => void,
  ): EventSubscription;
}
