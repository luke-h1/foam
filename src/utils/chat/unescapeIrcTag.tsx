/**
 * Unescapes IRC tag escape sequences
 */
export function unescapeIrcTag(value: string): string {
  return value
    .replace(/\\s/g, ' ')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\:/g, ':')
    .replace(/\\\\/g, '\\');
}
