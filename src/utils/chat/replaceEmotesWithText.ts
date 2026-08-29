import { ParsedPart } from './parsedPart';
import { getParsedPartStringContent } from './parsedPartContent';

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
           * `content` is the channel-facing alias, so reconstructed text
           * matches what was shown; restore overlaid zero-width words too.
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
