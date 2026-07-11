import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';

/**
 * Parse the `key=value;key2=value2` IRCv3 tag string into a map, unescaping
 * each value. Values may be empty and may themselves contain `=`.
 */
export function parseIrcTags(tagString: string): Record<string, string> {
  const tags: Record<string, string> = {};
  if (!tagString) {
    return tags;
  }

  let start = 0;
  while (start <= tagString.length) {
    const separatorIndex = tagString.indexOf(';', start);
    const endIndex = separatorIndex === -1 ? tagString.length : separatorIndex;
    /**
     * Split on the first `=` only (values may contain `=`) with two slices -
     * ~20 runs per message at up to 100 msg/s, keep it allocation-light.
     */
    const equalsIndex = tagString.indexOf('=', start);
    const hasValue = equalsIndex !== -1 && equalsIndex < endIndex;
    const key = tagString.slice(start, hasValue ? equalsIndex : endIndex);

    if (key) {
      tags[key] = unescapeIrcTag(
        hasValue ? tagString.slice(equalsIndex + 1, endIndex) : '',
      );
    }

    if (separatorIndex === -1) {
      break;
    }
    start = separatorIndex + 1;
  }

  return tags;
}
