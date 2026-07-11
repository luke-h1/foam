import type { MessageStructure } from '@app/utils/chat/deriveChatBody/types';

import { getMessageStructure } from '../getMessageStructure';
import {
  emote,
  link,
  mention,
  ritual,
  text,
} from './__fixtures__/deriveChatBody.fixture';

describe('getMessageStructure', () => {
  test('treats text, mention, link and non-zero-width emotes as inline', () => {
    const message = [text('hello '), mention('@forsen'), link('https://x.y')];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      canBeInline: true,
      containsEmotes: false,
    });
  });

  test('flags emote presence and keeps a plain emote inline', () => {
    const message = [text('nice '), emote('Kappa')];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      canBeInline: true,
      containsEmotes: true,
    });
  });

  test('a zero-width emote breaks inline flow', () => {
    const message = [emote('Kappa'), emote('RainTime', true)];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      canBeInline: false,
      containsEmotes: true,
    });
  });

  test('an emote carrying zero-width overlays breaks inline flow', () => {
    const base = emote('Kappa');
    base.overlaid = [emote('SoSnowy', true)];

    expect(getMessageStructure([text('gg '), base])).toEqual<MessageStructure>({
      canBeInline: false,
      containsEmotes: true,
    });
  });

  test('a notice part is not inlineable', () => {
    const message = [ritual()];

    expect(getMessageStructure(message)).toEqual<MessageStructure>({
      canBeInline: false,
      containsEmotes: false,
    });
  });

  test('returns the cached reference for the same parts array', () => {
    const message = [text('cached')];

    expect(getMessageStructure(message)).toBe(getMessageStructure(message));
  });
});
