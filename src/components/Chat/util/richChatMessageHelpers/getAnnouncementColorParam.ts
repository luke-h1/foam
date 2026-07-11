export function getAnnouncementColorParam(
  noticeTags: unknown,
): string | undefined {
  if (
    typeof noticeTags === 'object' &&
    noticeTags !== null &&
    'msg-param-color' in noticeTags &&
    typeof (noticeTags as { 'msg-param-color'?: unknown })[
      'msg-param-color'
    ] === 'string'
  ) {
    return (noticeTags as { 'msg-param-color': string })['msg-param-color'];
  }

  return undefined;
}
