import { applyAntiDuplicateSuffix } from '../applyAntiDuplicateSuffix';

describe('applyAntiDuplicateSuffix', () => {
  test('leaves the first send untouched', () => {
    expect(applyAntiDuplicateSuffix('hello', undefined)).toBe('hello');
  });

  test('leaves a message that differs from the previous send untouched', () => {
    expect(applyAntiDuplicateSuffix('hello', 'goodbye')).toBe('hello');
  });

  test('makes an immediate repeat distinct with an invisible suffix', () => {
    expect(applyAntiDuplicateSuffix('hello', 'hello')).toBe('hello \u{E0000}');
  });

  test('counts codepoints, so an emoji repeat still gets the suffix', () => {
    const emoji = '😀'.repeat(300);

    expect(applyAntiDuplicateSuffix(emoji, emoji)).toBe(`${emoji} \u{E0000}`);
  });

  test('leaves a max-length repeat alone rather than pushing it over the limit', () => {
    const atLimit = 'a'.repeat(500);

    expect(applyAntiDuplicateSuffix(atLimit, atLimit)).toBe(atLimit);
  });

  test('alternates so a run of repeats never collides', () => {
    const second = applyAntiDuplicateSuffix('hello', 'hello');

    expect(applyAntiDuplicateSuffix('hello', second)).toBe('hello');
  });
});
