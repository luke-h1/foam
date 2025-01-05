export default function parseBadgesTag(
  badgesTag: string,
): Record<string, string> {
  return badgesTag
    .split(',')
    .map(badge => badge.split('/'))
    .reduce(
      (acc, [k, v]) => ({
        ...acc,
        [k]: v,
      }),
      {},
    );
}
