import { replaceEmotesWithText } from '../replaceEmotesWithText';

describe('replaceEmotesWithText', () => {
  test('handles empty input', () => {
    expect(replaceEmotesWithText([])).toEqual('');
  });

  test('joins text and emote parts, using the alias each emote showed', () => {
    const result = replaceEmotesWithText([
      { type: 'text', content: 'Hello ' },
      { type: 'emote', content: 'KEKW', name: 'KEKW' },
      { type: 'text', content: ' ' },
      { type: 'emote', content: 'peepoAlias', name: 'peepoOriginal' },
      { type: 'text', content: ' World' },
    ]);

    expect(result).toBe('Hello KEKW peepoAlias World');
  });

  test('handles mentions', () => {
    const result = replaceEmotesWithText([
      { type: 'text', content: 'Hello ' },
      {
        type: 'mention',
        content: '@user',
        color: '#FF0000',
      },
      { type: 'text', content: ' World' },
    ]);

    expect(result).toBe('Hello @user World');
  });

  test('round-trips gif alt text for offset-based reprocessing', () => {
    const result = replaceEmotesWithText([
      { type: 'text', content: 'look ' },
      {
        type: 'gif',
        content: '[YAY GIF]',
        gifId: 'abc',
        url: 'https://example.com/a.gif',
      },
    ]);

    expect(result).toBe('look [YAY GIF]');
  });

  test('does not stringify custom object tokens', () => {
    const result = replaceEmotesWithText([
      { type: 'text', content: 'Added ' },
      {
        type: 'stvEmoteAdded',
        stvEvents: {
          type: 'added',
          data: {
            id: '123',
            name: 'Dance',
            url: 'https://example.com/dance.png',
            original_name: 'Dance',
            site: 'BTTV',
            provider: 'bttv',
            creator: null,
            emote_link: '',
            height: 32,
            width: 32,
          },
        },
      },
      { type: 'text', content: 'event' },
    ]);

    expect(result).toEqual('Added event');
  });

  test('restores overlaid zero-width emote names', () => {
    const result = replaceEmotesWithText([
      {
        type: 'emote',
        content: 'peepoHappy',
        overlaid: [
          { type: 'emote', content: 'SoSnowy' },
          { type: 'emote', content: 'IceCold' },
        ],
      },
      { type: 'text', content: ' hi' },
    ]);

    expect(result).toBe('peepoHappy SoSnowy IceCold hi');
  });
});
