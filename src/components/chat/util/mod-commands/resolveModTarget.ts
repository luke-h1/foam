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
