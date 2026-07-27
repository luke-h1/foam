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

  test('alternates so a run of repeats never collides', () => {
    // Each send compares against what actually went on the wire.
    const first = applyAntiDuplicateSuffix('hello', undefined);
    const second = applyAntiDuplicateSuffix('hello', first);
    const third = applyAntiDuplicateSuffix('hello', second);

    expect(first).toBe('hello');
    expect(second).not.toBe(first);
    expect(third).not.toBe(second);
  });
});
