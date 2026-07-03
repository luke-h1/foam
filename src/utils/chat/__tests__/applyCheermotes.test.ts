import { applyCheermotesToParts } from '../applyCheermotes';
import type { ChannelCheermotes, CheermoteTier } from '../cheermoteStore';
import type { ParsedPart } from '../parsedPart';

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
  test('splits a cheer token out of a text part', () => {
    const parts: ParsedPart[] = [
      { type: 'text', content: 'Cheer100 great play' },
    ];

    expect(applyCheermotesToParts(parts, makeCheermotes())).toEqual([
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
    const parts: ParsedPart[] = [{ type: 'text', content: 'gg cheer5 wp' }];

    expect(applyCheermotesToParts(parts, makeCheermotes())).toEqual([
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
    const parts: ParsedPart[] = [
      { type: 'text', content: 'no cheers here word1' },
    ];
    const cheermotes: ChannelCheermotes = new Map([['kappa', [tier1]]]);

    expect(applyCheermotesToParts(parts, cheermotes)).toBe(parts);
  });

  test('ignores zero-bit tokens and non-text parts', () => {
    const emotePart: ParsedPart = { type: 'emote', content: 'Kappa' };
    const parts: ParsedPart[] = [
      emotePart,
      { type: 'text', content: 'Cheer0' },
    ];

    const result = applyCheermotesToParts(parts, makeCheermotes());

    expect(result).toBe(parts);
  });

  test('handles multiple cheer tokens in one message', () => {
    const parts: ParsedPart[] = [{ type: 'text', content: 'Cheer1 Cheer100' }];

    expect(applyCheermotesToParts(parts, makeCheermotes())).toEqual([
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
