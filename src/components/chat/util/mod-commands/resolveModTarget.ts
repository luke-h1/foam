/**
 * The login a moderation action targets: the login when the selection has
 * one, else the display name.
 */
export function resolveModTarget(
  selection:
    | {
        login?: string;
        username?: string;
      }
    | null
    | undefined,
): string | undefined {
  return selection?.login?.trim() || selection?.username?.trim() || undefined;
}
