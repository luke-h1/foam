import { applyAntiDuplicateSuffix } from '../applyAntiDuplicateSuffix';

describe('applyAntiDuplicateSuffix', () => {
  test('leaves the first send untouched', () => {
    expect(applyAntiDuplicateSuffix('hello', undefined)).toBe('hello');
  });

  test('leaves a message that differs from the previous send untouched', () => {
    expect(applyAntiDuplicateSuffix('hello', 'goodbye')).toBe('hello');
  });

  test('makes an immediate repeat distinct without visible change', () => {
    const result = applyAntiDuplicateSuffix('hello', 'hello');

    expect(result).not.toBe('hello');
    expect(result.startsWith('hello')).toBe(true);
    expect(result.replace(/[\s\u{E0000}]+$/u, '')).toBe('hello');
  });

  test('counts codepoints, so an emoji repeat still gets the suffix', () => {
    // 300 emoji is 600 UTF-16 units but only 300 codepoints, well under 500.
    const emoji = '😀'.repeat(300);

    expect(applyAntiDuplicateSuffix(emoji, emoji)).not.toBe(emoji);
  });

  test('leaves a max-length repeat alone rather than pushing it over the limit', () => {
    const atLimit = 'a'.repeat(500);

    // Trading a duplicate-drop for a length-drop helps nobody.
    expect(applyAntiDuplicateSuffix(atLimit, atLimit)).toBe(atLimit);
  });

  test('alternates so a run of repeats never collides', () => {
    // Each send compares against what actually went on the wire.
    const first = applyAntiDuplicateSuffix('hello', undefined);
    const second = applyAntiDuplicateSuffix('hello', first);
    const third = applyAntiDuplicateSuffix('hello', second);

    // The third send is plain again precisely because it differs from the
    // suffixed second, which is what stops a run from colliding.
    expect(first).toBe('hello');
    expect(second).toBe(`hello ${'\u{E0000}'}`);
    expect(third).toBe('hello');
  });
});
