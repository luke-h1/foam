import type { EventSubscription } from 'expo-modules-core';

export type ImageMemoryPressureEvent = {
  /**
   * Android `ComponentCallbacks2` trim level (10 = RUNNING_LOW, 15 =
   * RUNNING_CRITICAL, 20 = UI_HIDDEN, 40 = BACKGROUND, 80 = COMPLETE); the
   * consumer picks the trim strength from it.
   */
  level: number;
};

export interface ImageMemoryPressureNativeModule {
  /**
   * Bytes of headroom before the OS reclaims this process: iOS
   * `os_proc_available_memory()`, Android system headroom above the
   * low-memory-killer threshold. Returns 0 when the native module is
   * unavailable (web, or before the native build ships), which the caller
   * treats as "monitoring disabled".
   */
  getAvailableMemory(): number;

  addListener?(
    eventName: 'onMemoryPressure',
    listener: (event: ImageMemoryPressureEvent) => void,
  ): EventSubscription;
}
