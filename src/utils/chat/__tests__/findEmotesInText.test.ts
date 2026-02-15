import type { SanitisedEmote } from '@app/types/emote';
import {
  findEmotesInText,
  FindEmotesInTextReturn,
} from '../replaceTextWithEmotes';

describe('FindEmotesInText', () => {
  const createMockEmote = (name: string): SanitisedEmote => ({
    id: '1',
    name,
    emote_link: `https://example.com/${name}.png`,
    url: `https://example.com/${name}.png`,
    creator: 'UNKNOWN',
    original_name: name,
    site: 'Twitch Channel',
  });

  const createNonTwitchMockEmote = (name: string): SanitisedEmote => ({
    id: '1',
    name,
    emote_link: `https://example.com/${name}.png`,
    url: `https://example.com/${name}.png`,
    creator: 'UNKNOWN',
    original_name: name,
    site: 'FFZ',
  });

  const createEmoteMap = (
    emoteNames: string[],
    factory: (name: string) => SanitisedEmote = createMockEmote,
  ): Map<string, SanitisedEmote> => {
    const map = new Map<string, SanitisedEmote>();
    emoteNames.forEach(name => {
      map.set(name, factory(name));
    });
    return map;
  };

  test('should find a single emote at the start of the text node', () => {
    const emoteMap = createEmoteMap(['Kappa']);
    const result = findEmotesInText('Kappa hello', emoteMap);

    expect(result).toEqual<FindEmotesInTextReturn[]>([
      {
        emote: createMockEmote('Kappa'),
        start: 0,
        end: 5,
      },
    ]);
  });

  test('should find a single emote at the end of the text node', () => {
    const emoteMap = createEmoteMap(['Kappa']);
    const result = findEmotesInText('hello Kappa', emoteMap);

    expect(result).toEqual<FindEmotesInTextReturn[]>([
      {
        emote: createMockEmote('Kappa'),
        start: 6,
        end: 11,
      },
    ]);
  });

  test('should find a single emote in the middle of the text node', () => {
    const emoteMap = createEmoteMap(['Kappa']);
    const result = findEmotesInText('hello Kappa world', emoteMap);

    expect(result).toEqual<FindEmotesInTextReturn[]>([
      {
        emote: createMockEmote('Kappa'),
        start: 6,
        end: 11,
      },
    ]);
  });

  test('should handle overlapping emote names correctly', () => {
    const emoteMap = createEmoteMap(['Kappa', 'KappaHD']);
    const result = findEmotesInText('KappaHD hello Kappa', emoteMap);

    // Should find KappaHD first because it's longer
    expect(result).toEqual([
      {
        emote: createMockEmote('KappaHD'),
        start: 0,
        end: 7,
      },
      {
        emote: createMockEmote('Kappa'),
        start: 14,
        end: 19,
      },
    ]);
  });

  test('should not match emotes that are part of other words', () => {
    const emoteMap = createEmoteMap(['Kappa'], createNonTwitchMockEmote);
    const result = findEmotesInText(
      'PreKappa KappaPost NotKappaHere',
      emoteMap,
    );

    expect(result).toEqual([]);
  });

  test('should handle empty text', () => {
    const emoteMap = createEmoteMap(['Kappa']);
    const result = findEmotesInText('', emoteMap);

    expect(result).toEqual([]);
  });

  test('should handle text with no emotes', () => {
    const emoteMap = createEmoteMap(['Kappa']);
    const result = findEmotesInText('Hello world', emoteMap);

    expect(result).toEqual([]);
  });

  test('should handle repeated emotes', () => {
    const emoteMap = createEmoteMap(['Kappa']);
    const result = findEmotesInText('Kappa hello Kappa', emoteMap);

    expect(result).toEqual([
      {
        emote: createMockEmote('Kappa'),
        start: 0,
        end: 5,
      },
      {
        emote: createMockEmote('Kappa'),
        start: 12,
        end: 17,
      },
    ]);
  });

  test('should respect word boundaries', () => {
    const emoteMap = createEmoteMap(['Pog'], createNonTwitchMockEmote);
    const result = findEmotesInText('Pog PogChamp Pog NotPog PogNot', emoteMap);

    // Should only match the standalone 'Pog'
    expect(result).toEqual([
      {
        emote: createNonTwitchMockEmote('Pog'),
        start: 0,
        end: 3,
      },
      {
        emote: createNonTwitchMockEmote('Pog'),
        start: 13,
        end: 16,
      },
    ]);
  });
});
