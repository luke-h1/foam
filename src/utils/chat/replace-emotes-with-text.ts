import { MessageToken } from './message-token';
import { getMessageTokenText } from './message-token-content';

export function replaceEmotesWithText(tokens: MessageToken[]): string {
  if (tokens.length === 0) {
    return '';
  }

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return tokens
    .map(token => {
      switch (token.type) {
        case 'emote': {
          /**
           * `content` is the channel-facing alias, so reconstructed text
           * matches what was shown; restore overlaid zero-width words too.
           */
          const baseText = getMessageTokenText(token);

          const overlaidText = (token.overlaid ?? [])
            .flatMap(overlay => {
              const overlayText = getMessageTokenText(overlay);
              return overlayText ? [overlayText] : [];
            })
            .join(' ');

          return overlaidText ? `${baseText} ${overlaidText}` : baseText;
        }

        case 'mention':
          return token.content ? `${token.content} ` : '';

        default:
          return getMessageTokenText(token);
      }
    })
    .join('');
}
