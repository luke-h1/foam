export interface SignpostNativeModule {
  /**
   * Instant Points of Interest marker. The label is the signpost message in
   * Instruments.
   */
  mark(name: string): void;

  /**
   * Begin a named interval. Pair with `end(name)` using the same string.
   */
  begin(name: string): void;

  /**
   * End a previously begun interval. No-op if `begin` was never called for
   * `name`.
   */
  end(name: string): void;
}
