export interface ImageMemoryPressureNativeModule {
  /**
   * Bytes of memory remaining before this process hits its iOS memory limit and
   * is jettisoned (os_proc_available_memory). Returns 0 when the native module
   * is unavailable (Android, web, or before the native build ships), which the
   * caller treats as "monitoring disabled".
   */
  getAvailableMemory(): number;
}
