export interface FullyDrawnNativeModule {
  /**
   * Calls `Activity.reportFullyDrawn()` so `am start -W` and Play Console
   * report the time to a usable first screen. No-op off Android.
   */
  report(): void;
}
