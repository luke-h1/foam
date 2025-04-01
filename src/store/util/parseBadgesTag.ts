const parseBadgesTag = (badgesTag: string): Record<string, string> =>
  badgesTag
    .split(',')
    .map(badge => badge.split('/'))
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore

    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

export default parseBadgesTag;
