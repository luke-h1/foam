/**
 * Unescapes IRCv3 tag escapes in one pass so wire `\\s` becomes the literal
 * `\s`, not a space - chained `.replace()` calls get that case wrong.
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
