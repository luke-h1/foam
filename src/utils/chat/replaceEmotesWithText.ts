import type { MessageToken } from '@app/types/chat/messageToken';

import { getMessageTokenText } from './messageTokenContent';

export function replaceEmotesWithText(tokens: MessageToken[]): string {
  return tokens
    .map(token => {
      switch (token.type) {
        case 'emote': {
          const baseText = getMessageTokenText(token);

          const overlaidText = (token.overlaid ?? [])
            .flatMap(overlay => {
              const overlayText = getMessageTokenText(overlay);
              return overlayText ? [overlayText] : [];
            })
            .join(' ');

          return overlaidText ? `${baseText} ${overlaidText}` : baseText;
        }

        default:
          return getMessageTokenText(token);
      }
    })
    .join('');
}
