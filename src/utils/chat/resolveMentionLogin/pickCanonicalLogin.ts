export function pickCanonicalLogin(
  existing: string | undefined,
  candidate: string,
): string {
  const trimmed = candidate.trim();
  if (!trimmed) {
    return existing ?? candidate;
  }

  if (!existing) {
    return trimmed;
  }

  const existingHasCase = existing !== existing.toLowerCase();
  const candidateHasCase = trimmed !== trimmed.toLowerCase();

  if (candidateHasCase && !existingHasCase) {
    return trimmed;
  }

  return existing;
}
