import { ParsedPart } from './parsedPart';
import { getParsedPartStringContent } from './parsedPartContent';

/**
 * Rebuilds the plain text of a parsed message, for copying it back out.
 */
export function replaceEmotesWithText(parts: ParsedPart[]): string {
  if (parts.length === 0) {
    return '';
  }

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return parts
    .map(part => {
      switch (part.type) {
        case 'emote': {
          /**
           * Use the channel-facing text: the parsed `content` is the alias as it
           * appears in this channel (or the emoji character), so reconstructed
           * text matches what was shown rather than the emote's global
           * original_name. Overlaid zero-width emotes were stripped from the
           * part list during composition, so restore their words here.
           */
          const baseText = getParsedPartStringContent(part);
          const overlaidText = (part.overlaid ?? [])
            .flatMap(overlay => {
              const overlayText = getParsedPartStringContent(overlay);
              return overlayText ? [overlayText] : [];
            })
            .join(' ');
          return overlaidText ? `${baseText} ${overlaidText}` : baseText;
        }

        case 'mention':
          return part.content ? `${part.content} ` : '';

        default:
          return getParsedPartStringContent(part);
      }
    })
    .join('');
}
