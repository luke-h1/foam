/**
 * Unescapes IRCv3 message-tag escape sequences (`\s`→space, `\:`→`;`,
 * `\r`→CR, `\n`→LF, `\\`→`\`). Decoding is a single left-to-right pass so an
 * escaped backslash is consumed as one unit: the wire value `\\s` becomes the
 * literal `\s`, not a space. A chained
 * `.replace('\\s',' ')...replace('\\\\','\\')` gets that case wrong because the
 * `\s` pass fires before the `\\` pass.
 */
export function unescapeIrcTag(value: string): string {
  if (!value.includes('\\')) {
    return value;
  }

  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '\\') {
      result += value[index];
      continue;
    }

    const next = value[index + 1];
    if (next === undefined) {
      // Lone trailing backslash is dropped per IRCv3.
      break;
    }

    switch (next) {
      case 's':
        result += ' ';
        break;
      case ':':
        result += ';';
        break;
      case 'n':
        result += '\n';
        break;
      case 'r':
        result += '\r';
        break;
      case 't':
        result += '\t';
        break;
      case '\\':
        result += '\\';
        break;
      default:
        // A backslash before any other character yields that character.
        result += next;
        break;
    }
    index += 1;
  }

  return result;
}
