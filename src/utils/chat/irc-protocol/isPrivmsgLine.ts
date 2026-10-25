/**
 * Steps past an optional leading section that starts with `marker` and ends at
 * the next space. Returns -1 when the section never closes, which means the
 * line is malformed.
 */
function skipSection(line: string, from: number, marker: number): number {
  if (from === -1 || line.charCodeAt(from) !== marker) {
    return from;
  }

  const spaceIndex = line.indexOf(' ', from);
  return spaceIndex === -1 ? -1 : spaceIndex + 1;
}

export function isPrivmsgLine(line: string): boolean {
  let index = 0;

  // 64 = '@' (optional IRCv3 tags prefix)
  index = skipSection(line, index, 64);

  // 58 = ':' (optional source prefix)
  index = skipSection(line, index, 58);

  return index !== -1 && line.startsWith('PRIVMSG ', index);
}
