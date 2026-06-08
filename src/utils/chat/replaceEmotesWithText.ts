import { ParsedPart } from './replaceTextWithEmotes';
import { getParsedPartStringContent } from './getParsedPartStringContent';

/**
 * Converts a parsed chat message (with emotes) back to plain text (used for copying messages)
 * @param parts Array of parsed parts (text, emotes, mentions)
 * @returns Plain text string with emotes converted to their text node
 */
export function replaceEmotesWithText(parts: ParsedPart[]): string {
  if (!parts || parts.length === 0) {
    return '';
  }

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return parts
    .map(part => {
      switch (part.type) {
        case 'emote':
          /**
           * For emotes - use the original name
           */
          return part.original_name || getParsedPartStringContent(part);

        case 'mention':
          /**
           * For mentions, preserve @ symbol, username &
           * add a space at the end
           */
          return part.content ? `${part.content} ` : '';

        case 'text':
          /**
           * Return content as is
           */
          return getParsedPartStringContent(part);

        /**
         * Our custom types
         */
        case 'notice':
        case 'stvEmote':
        case 'stv_emote_added':
        case 'stv_emote_removed':
        case 'twitchClip':
        case 'sub':
        case 'resub':
        case 'submysterygift':
        case 'giftpaidupgrade':
        case 'anongiftpaidupgrade':
        case 'anongift':
          return getParsedPartStringContent(part);

        default:
          return getParsedPartStringContent(part);
      }
    })
    .join('');
}
