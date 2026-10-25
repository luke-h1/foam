import { webKitSafeLayerImageUrl } from '../webKitSafeLayerImageUrl';

describe('webKitSafeLayerImageUrl', () => {
  test('rewrites a 7TV CDN paint-layer webp to its avif sibling', () => {
    expect(
      webKitSafeLayerImageUrl(
        'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.webp',
      ),
    ).toEqual('https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif');
  });

  test('preserves a trailing query string', () => {
    expect(
      webKitSafeLayerImageUrl(
        'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.webp?v=2',
      ),
    ).toEqual('https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif?v=2');
  });

  test('leaves avif and non-webp layer URLs untouched', () => {
    expect(
      webKitSafeLayerImageUrl(
        'https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif',
      ),
    ).toEqual('https://cdn.7tv.app/paint/01ABC/layer/01DEF/4x.avif');
  });

  test('leaves webp URLs from other hosts untouched', () => {
    expect(webKitSafeLayerImageUrl('https://example.com/x.webp')).toEqual(
      'https://example.com/x.webp',
    );
  });
});
