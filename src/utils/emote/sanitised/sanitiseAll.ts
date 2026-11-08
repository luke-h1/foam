/**
 * Runs a sanitiser over a raw list and drops each entry it rejects. A worklet,
 * so the 7TV set sanitiser can call it on the background parse runtime.
 */
export function sanitiseAll<TRaw, TSanitised>(
  raw: readonly TRaw[],
  sanitiseOne: (entry: TRaw) => TSanitised | null,
): TSanitised[] {
  'worklet';

  const sanitised: TSanitised[] = [];

  for (const entry of raw) {
    const result = sanitiseOne(entry);

    if (result) {
      sanitised.push(result);
    }
  }

  return sanitised;
}
