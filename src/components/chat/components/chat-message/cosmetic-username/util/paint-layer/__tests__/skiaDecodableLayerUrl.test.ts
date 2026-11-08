import { skiaDecodableLayerUrl } from '../skiaDecodableLayerUrl';

describe('skiaDecodableLayerUrl', () => {
  test('rewrites a 7TV CDN paint-layer avif to its webp sibling', () => {
    expect(
      skiaDecodableLayerUrl(
        'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif?v=2',
      ),
    ).toBe('https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.webp?v=2');
  });

  test('leaves webp layer urls and other hosts untouched', () => {
    expect(
      skiaDecodableLayerUrl(
        'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.webp',
      ),
    ).toBe('https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.webp');

    expect(skiaDecodableLayerUrl('https://example.com/x.avif')).toBe(
      'https://example.com/x.avif',
    );
  });
});
