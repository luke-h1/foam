import { parseTwitchGifsTag } from '../parse-twitch-gifs-tag';
import { splitMessageAroundGifs } from '../split-message-around-gifs';

describe('splitMessageAroundGifs', () => {
  test('returns the full message as text when there are no spans', () => {
    expect(splitMessageAroundGifs('hello', [])).toEqual([
      { kind: 'text', text: 'hello' },
    ]);
  });

  test('splits text around a leading GIF span', () => {
    const spans = parseTwitchGifsTag(
      '0-4|abc|https://a.example/g.gif',
      'hello there',
    );

    expect(splitMessageAroundGifs('hello there', spans)).toEqual([
      {
        kind: 'gif',
        gifId: 'abc',
        url: 'https://a.example/g.gif',
        content: 'hello',
      },
      { kind: 'text', text: ' there' },
    ]);
  });

  test('keeps text on both sides of a mid-message GIF', () => {
    const spans = parseTwitchGifsTag(
      '6-10|abc|https://a.example/g.gif',
      'hello world!',
    );

    expect(splitMessageAroundGifs('hello world!', spans)).toEqual([
      { kind: 'text', text: 'hello ' },
      {
        kind: 'gif',
        gifId: 'abc',
        url: 'https://a.example/g.gif',
        content: 'world',
      },
      { kind: 'text', text: '!' },
    ]);
  });
});
