export const parseTwitchEmotesTag = (
  emotesTag: string | undefined,
): Record<string, string[]> | undefined => {
  if (!emotesTag?.trim()) {
    return undefined;
  }

  const entries = emotesTag.split('/').flatMap(entry => {
    const trimmed = entry.trim();
    return trimmed ? [trimmed] : [];
  });

  if (entries.length === 0) {
    return undefined;
  }

  return entries.reduce<Record<string, string[]>>((resolved, entry) => {
    const [emoteId, positionsRaw] = entry.split(':');
    if (!emoteId || !positionsRaw) {
      return resolved;
    }

    const positions = positionsRaw.split(',').flatMap(position => {
      const trimmed = position.trim();
      return trimmed ? [trimmed] : [];
    });

    if (positions.length > 0) {
      resolved[emoteId] = positions;
    }

    return resolved;
  }, {});
};
