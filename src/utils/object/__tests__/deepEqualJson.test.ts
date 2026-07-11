import { deepEqualJson } from '../deepEqualJson';

describe('deepEqualJson', () => {
  test('compares primitives by value', () => {
    expect(deepEqualJson(1, 1)).toBe(true);
    expect(deepEqualJson('a', 'a')).toBe(true);
    expect(deepEqualJson(null, null)).toBe(true);
    expect(deepEqualJson(1, 2)).toBe(false);
    expect(deepEqualJson(1, '1')).toBe(false);
    expect(deepEqualJson(null, undefined)).toBe(false);
    expect(deepEqualJson(0, false)).toBe(false);
  });

  test('is insensitive to object key order', () => {
    expect(deepEqualJson({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(
      deepEqualJson(
        { outer: { a: [1, 2], b: null } },
        { outer: { b: null, a: [1, 2] } },
      ),
    ).toBe(true);
  });

  test('detects differing values, missing keys, and extra keys', () => {
    expect(deepEqualJson({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqualJson({ a: 1 }, {})).toBe(false);
    expect(deepEqualJson({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqualJson({ a: { b: 1 } }, { a: { b: 1, c: 2 } })).toBe(false);
  });

  test('compares arrays element-wise in order', () => {
    expect(deepEqualJson([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqualJson([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(deepEqualJson([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqualJson([{ a: 1 }], [{ a: 1 }])).toBe(true);
    expect(deepEqualJson([], {})).toBe(false);
  });

  test('distinguishes explicit undefined from a missing key', () => {
    expect(deepEqualJson({ a: undefined }, {})).toBe(false);
    expect(deepEqualJson({ a: undefined }, { a: undefined })).toBe(true);
  });
});
