import type {
  ChannelCheermotes,
  CheermoteTier,
} from '@app/utils/chat/cheermote-store/types';

import { applyCheermotesToParts } from '../apply-cheermotes';
import type { MessageToken } from '../message-token';

const tier1: CheermoteTier = {
  color: '#979797',
  minBits: 1,
  staticUrl: 'https://cdn.example.com/cheer/1.png',
  url: 'https://cdn.example.com/cheer/1.gif',
};

const tier100: CheermoteTier = {
  color: '#9c3ee8',
  minBits: 100,
  staticUrl: 'https://cdn.example.com/cheer/100.png',
  url: 'https://cdn.example.com/cheer/100.gif',
};

function makeCheermotes(): ChannelCheermotes {
  return new Map([['cheer', [tier1, tier100]]]);
}

describe('applyCheermotesToParts', () => {
  test('splits a cheer token out of a text token', () => {
    const tokens: MessageToken[] = [
      { type: 'text', content: 'Cheer100 great play' },
    ];

    expect(applyCheermotesToParts(tokens, makeCheermotes())).toEqual<
      MessageToken[]
    >([
      {
        type: 'cheermote',
        content: 'Cheer100',
        cheermote: {
          bits: 100,
          color: '#9c3ee8',
          prefix: 'Cheer',
          static_url: 'https://cdn.example.com/cheer/100.png',
          url: 'https://cdn.example.com/cheer/100.gif',
        },
      },
      { type: 'text', content: ' great play' },
    ]);
  });

  test('matches prefixes case-insensitively and keeps surrounding text', () => {
    const tokens: MessageToken[] = [{ type: 'text', content: 'gg cheer5 wp' }];

    expect(applyCheermotesToParts(tokens, makeCheermotes())).toEqual<
      MessageToken[]
    >([
      { type: 'text', content: 'gg ' },
      {
        type: 'cheermote',
        content: 'cheer5',
        cheermote: {
          bits: 5,
          color: '#979797',
          prefix: 'cheer',
          static_url: 'https://cdn.example.com/cheer/1.png',
          url: 'https://cdn.example.com/cheer/1.gif',
        },
      },
      { type: 'text', content: ' wp' },
    ]);
  });

  test('returns the input array unchanged when nothing matches', () => {
    const tokens: MessageToken[] = [
      { type: 'text', content: 'no cheers here word1' },
    ];

    const cheermotes: ChannelCheermotes = new Map([['kappa', [tier1]]]);

    expect(applyCheermotesToParts(tokens, cheermotes)).toBe(tokens);
  });

  test('ignores zero-bit tokens and non-text tokens', () => {
    const emotePart: MessageToken = { type: 'emote', content: 'Kappa' };

    const tokens: MessageToken[] = [
      emotePart,
      { type: 'text', content: 'Cheer0' },
    ];

    const result = applyCheermotesToParts(tokens, makeCheermotes());

    expect(result).toBe(tokens);
  });

  test('selects the highest tier at or below the cheered bits', () => {
    const tokens: MessageToken[] = [{ type: 'text', content: 'Cheer50' }];

    expect(applyCheermotesToParts(tokens, makeCheermotes())).toEqual<
      MessageToken[]
    >([
      {
        type: 'cheermote',
        content: 'Cheer50',
        cheermote: {
          bits: 50,
          color: '#979797',
          prefix: 'Cheer',
          static_url: 'https://cdn.example.com/cheer/1.png',
          url: 'https://cdn.example.com/cheer/1.gif',
        },
      },
    ]);
  });

  test('leaves malformed cheer tokens as plain text', () => {
    const tokens: MessageToken[] = [
      { type: 'text', content: 'Cheer 100 Cheer1.5' },
    ];

    expect(applyCheermotesToParts(tokens, makeCheermotes())).toBe(tokens);
  });

  test('handles multiple cheer tokens in one message', () => {
    const tokens: MessageToken[] = [
      { type: 'text', content: 'Cheer1 Cheer100' },
    ];

    expect(applyCheermotesToParts(tokens, makeCheermotes())).toEqual<
      MessageToken[]
    >([
      {
        type: 'cheermote',
        content: 'Cheer1',
        cheermote: {
          bits: 1,
          color: '#979797',
          prefix: 'Cheer',
          static_url: 'https://cdn.example.com/cheer/1.png',
          url: 'https://cdn.example.com/cheer/1.gif',
        },
      },
      { type: 'text', content: ' ' },
      {
        type: 'cheermote',
        content: 'Cheer100',
        cheermote: {
          bits: 100,
          color: '#9c3ee8',
          prefix: 'Cheer',
          static_url: 'https://cdn.example.com/cheer/100.png',
          url: 'https://cdn.example.com/cheer/100.gif',
        },
      },
    ]);
  });
});
