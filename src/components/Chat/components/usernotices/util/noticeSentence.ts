export function splitNoticeSubject(
  body: string,
  displayName: string,
): { lead: string | undefined; rest: string } {
  if (!displayName) {
    return { lead: undefined, rest: body };
  }

  if (body.startsWith(`${displayName} `)) {
    return {
      lead: displayName,
      rest: body.slice(displayName.length).trimStart(),
    };
  }

  if (body === displayName) {
    return { lead: displayName, rest: '' };
  }

  return { lead: undefined, rest: body };
}
