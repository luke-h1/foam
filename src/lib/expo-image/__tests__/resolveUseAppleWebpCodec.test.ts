import { resolveUseAppleWebpCodec } from '@app/lib/expo-image/resolveUseAppleWebpCodec';

test('keeps known-animated urls on libwebp', () => {
  expect(resolveUseAppleWebpCodec('animated')).toBe(false);
  expect(
    resolveUseAppleWebpCodec('animated', { preferAppleCodecForStatic: true }),
  ).toBe(false);
});

test('keeps urls of unknown kind on libwebp', () => {
  expect(resolveUseAppleWebpCodec(null)).toBe(false);
  expect(
    resolveUseAppleWebpCodec(null, { preferAppleCodecForStatic: true }),
  ).toBe(false);
});

test('opts into the apple codec only for proven-static urls', () => {
  expect(
    resolveUseAppleWebpCodec('static', { preferAppleCodecForStatic: true }),
  ).toBe(true);
  expect(resolveUseAppleWebpCodec('static')).toBe(false);
});
