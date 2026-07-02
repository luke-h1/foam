import { describeEmoteUrl } from '../describeEmoteUrl';

describe('describeEmoteUrl', () => {
  test('classifies an animated 7TV variant', () => {
    expect(
      describeEmoteUrl(
        'https://cdn.7tv.app/emote/01F6MZGCMR000F9PFB2X8E0V0V/2x.avif',
      ),
    ).toEqual({
      provider: '7tv',
      id: '01F6MZGCMR000F9PFB2X8E0V0V',
      scale: '2x',
      kind: 'animated',
    });
  });

  test('classifies a static 7TV variant', () => {
    expect(
      describeEmoteUrl('https://cdn.7tv.app/emote/abc/4x_static.webp'),
    ).toEqual({ provider: '7tv', id: 'abc', scale: '4x', kind: 'static' });
  });

  test('classifies a BTTV variant', () => {
    expect(describeEmoteUrl('https://cdn.betterttv.net/emote/xyz/3x')).toEqual({
      provider: 'bttv',
      id: 'xyz',
      scale: '3x',
      kind: null,
    });
    expect(
      describeEmoteUrl('https://cdn.betterttv.net/emote/xyz/3x.png'),
    ).toEqual({
      provider: 'bttv',
      id: 'xyz',
      scale: '3x',
      kind: 'static',
    });
  });

  test('classifies an animated FFZ variant', () => {
    expect(
      describeEmoteUrl('https://cdn.frankerfacez.com/emote/777/animated/4'),
    ).toEqual({ provider: 'ffz', id: '777', scale: '4', kind: 'animated' });
  });

  test('classifies a Twitch variant', () => {
    expect(
      describeEmoteUrl(
        'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
      ),
    ).toEqual({ provider: 'twitch', id: '25', scale: '3.0', kind: 'animated' });
  });

  test('returns unknown for an unrecognised url', () => {
    expect(describeEmoteUrl('https://example.com/foo.png')).toEqual({
      provider: 'unknown',
      id: null,
      scale: null,
      kind: null,
    });
  });
});
