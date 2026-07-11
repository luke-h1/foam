export function isPrivmsgLine(line: string): boolean {
  let index = 0;
  if (line.charCodeAt(index) === 64 /* @ */) {
    const spaceIndex = line.indexOf(' ', index);
    if (spaceIndex === -1) {
      return false;
    }
    index = spaceIndex + 1;
  }
  if (line.charCodeAt(index) === 58 /* : */) {
    const spaceIndex = line.indexOf(' ', index);
    if (spaceIndex === -1) {
      return false;
    }
    index = spaceIndex + 1;
  }
  return line.startsWith('PRIVMSG ', index);
}
