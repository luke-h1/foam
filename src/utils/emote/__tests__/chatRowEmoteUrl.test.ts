import {
  getChatRowAnimatedEmoteUrl,
  getChatRowEmoteUrl,
  getChatRowStaticEmoteUrl,
} from '@app/utils/emote/chatRowEmoteUrl';

const variants = {
  animated: {
    '1x': 'https://cdn.example.test/a/1x.webp',
    '3x': 'https://cdn.example.test/a/3x.webp',
    '4x': 'https://cdn.example.test/a/4x.webp',
  },
  static: {
    '3x': 'https://cdn.example.test/s/3x.webp',
    '4x': 'https://cdn.example.test/s/4x.webp',
  },
};

test('takes the 3x variant when the provider has one', () => {
  const emote = {
    image_variants: variants,
    url: 'https://cdn.example.test/a/4x.webp',
    static_url: 'https://cdn.example.test/s/4x.webp',
  };

  expect(getChatRowAnimatedEmoteUrl(emote)).toBe(
    'https://cdn.example.test/a/3x.webp',
  );

  expect(getChatRowStaticEmoteUrl(emote)).toBe(
    'https://cdn.example.test/s/3x.webp',
  );
});

test('keeps the canonical url when there is no 3x slot', () => {
  const emote = {
    image_variants: {
      animated: { '4x': 'https://cdn.example.test/a/4x.webp' },
    },
    url: 'https://cdn.example.test/a/4x.webp',
    static_url: 'https://cdn.example.test/s/4x.webp',
  };

  expect(getChatRowAnimatedEmoteUrl(emote)).toBe(
    'https://cdn.example.test/a/4x.webp',
  );

  expect(getChatRowStaticEmoteUrl(emote)).toBe(
    'https://cdn.example.test/s/4x.webp',
  );
});

test('keeps a missing static url missing', () => {
  expect(
    getChatRowStaticEmoteUrl({ image_variants: variants, url: 'x' }),
  ).toBeUndefined();
});

test('prefers the static url when animations are off', () => {
  expect(
    getChatRowEmoteUrl(
      {
        image_variants: variants,
        url: 'https://cdn.example.test/a/4x.webp',
        static_url: 'https://cdn.example.test/s/4x.webp',
      },
      { disableAnimations: true },
    ),
  ).toBe('https://cdn.example.test/s/3x.webp');
});
