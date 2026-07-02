export interface CpuUsageNativeModule {
  /**
   * Total CPU usage for the current process, summed across all threads (the
   * number `top` shows for the app; can exceed 100 on multiple cores). Returns
   * 0 when the native module is unavailable.
   */
  getUsage(): number;
}
