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
