import {
  parseTwitchGifsTag,
  type TwitchGifSpan,
} from '../parse-twitch-gifs-tag';

const EXAMPLE_URL =
  'https://media4.giphy.com/media/joSNxeswxuc74Juo8X/giphy.gif?cid=095d7a5dzizsiwgabonagkmigggv8v1spfai91ac3x0dsiy0&ep=v1_gifs_trending&rid=giphy.gif&ct=g';

const EXAMPLE_BODY = '[Y A Y Yes GIF by Djemilah Birnie]';

describe('parseTwitchGifsTag', () => {
  test('parses the documented Twitch `PRIVMSG` gifs example', () => {
    expect(
      parseTwitchGifsTag(
        `0-33|joSNxeswxuc74Juo8X|${EXAMPLE_URL}`,
        EXAMPLE_BODY,
      ),
    ).toEqual<TwitchGifSpan[]>([
      {
        start: 0,
        end: 33,
        gifId: 'joSNxeswxuc74Juo8X',
        url: EXAMPLE_URL,
        content: EXAMPLE_BODY,
      },
    ]);
  });

  test('returns an empty list when the tag is missing or blank', () => {
    expect(parseTwitchGifsTag(undefined, EXAMPLE_BODY)).toEqual([]);

    expect(parseTwitchGifsTag('   ', EXAMPLE_BODY)).toEqual([]);
  });

  test('keeps commas that sit inside a GIF URL', () => {
    const urlWithComma = 'https://example.com/giphy.gif?ids=a,b&rid=giphy.gif';

    expect(parseTwitchGifsTag(`0-4|abc123|${urlWithComma}`, 'hello')).toEqual<
      TwitchGifSpan[]
    >([
      {
        start: 0,
        end: 4,
        gifId: 'abc123',
        url: urlWithComma,
        content: 'hello',
      },
    ]);
  });

  test('parses multiple GIF entries and sorts by start index', () => {
    expect(
      parseTwitchGifsTag(
        `6-10|second|https://b.example/g.gif,0-4|first|https://a.example/g.gif`,
        'hello world',
      ),
    ).toEqual<TwitchGifSpan[]>([
      {
        start: 0,
        end: 4,
        gifId: 'first',
        url: 'https://a.example/g.gif',
        content: 'hello',
      },
      {
        start: 6,
        end: 10,
        gifId: 'second',
        url: 'https://b.example/g.gif',
        content: 'world',
      },
    ]);
  });

  test('indexes by Unicode code point when surrogate pairs are present', () => {
    // "👍hi" is three code points; the GIF covers the thumbs-up only.
    expect(
      parseTwitchGifsTag('0-0|emoji|https://e.example/g.gif', '👍hi'),
    ).toEqual<TwitchGifSpan[]>([
      {
        start: 0,
        end: 0,
        gifId: 'emoji',
        url: 'https://e.example/g.gif',
        content: '👍',
      },
    ]);
  });

  test('skips malformed entries', () => {
    expect(
      parseTwitchGifsTag('not-a-gif,0-4|ok|https://ok.example/g.gif', 'hello'),
    ).toEqual<TwitchGifSpan[]>([
      {
        start: 0,
        end: 4,
        gifId: 'ok',
        url: 'https://ok.example/g.gif',
        content: 'hello',
      },
    ]);
  });

  test('skips entries whose offsets overflow to Infinity', () => {
    const hugeEnd = '9'.repeat(309);

    expect(
      parseTwitchGifsTag(
        `0-${hugeEnd}|bad|https://bad.example/g.gif,0-4|ok|https://ok.example/g.gif`,
        'hello',
      ),
    ).toEqual<TwitchGifSpan[]>([
      {
        start: 0,
        end: 4,
        gifId: 'ok',
        url: 'https://ok.example/g.gif',
        content: 'hello',
      },
    ]);
  });
});
