import { chunk } from '@app/utils/collection/chunk';

describe('chunk', () => {
  test('splits a list into runs of the size, with a shorter last run', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('returns no runs for an empty list', () => {
    expect(chunk([], 3)).toEqual([]);
  });
});
