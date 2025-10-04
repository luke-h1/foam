import { ParsedPart } from './replaceTextWithEmotes';

/**
 * Converts a parsed chat message (with emotes) back to plain text (used for copying messages)
 * @param parts Array of parsed parts (text, emotes, mentions)
 * @returns Plain text string with emotes converted to their text node
 */
export function replaceEmotesWithText(parts: ParsedPart[]): string {
  if (!parts || parts.length === 0) {
    return '';
  }

  return parts
    .map(part => {
      switch (part.type) {
        case 'emote':
          /**
           * For emotes - use the original name
           */
          return part.original_name || part.content;

        case 'mention':
          /**
           * For mentions, preserve @ symbol, username &
           * add a space at the end
           */
          return `${part.content} `;

        case 'text':
          /**
           * Return content as is
           */
          return part.content;

        case 'notice':
        case 'stvEmote':
        case 'stv_emote_added':
        case 'stv_emote_removed':
        case 'twitchClip':
          return part;

        default:
          // @ts-expect-error - ts struggling to narrow type of part
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return part.content;
      }
    })
    .join('');
}
