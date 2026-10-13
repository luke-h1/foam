import { flattenInfiniteQueryPages } from '../flatten-infinite-query-pages';

describe('flattenInfiniteQueryPages', () => {
  test('flattens page data and removes empty items', () => {
    expect(
      flattenInfiniteQueryPages([
        { data: [{ id: 'one' }, undefined, { id: 'two' }] },
        undefined,
        { data: [null, { id: 'three' }] },
      ]),
    ).toEqual([{ id: 'one' }, { id: 'two' }, { id: 'three' }]);
  });

  test('keeps the first copy of an item that appears on two pages', () => {
    expect(
      flattenInfiniteQueryPages([
        {
          data: [
            { id: 'one', rank: 1 },
            { id: 'two', rank: 2 },
          ],
        },
        {
          data: [
            { id: 'two', rank: 3 },
            { id: 'three', rank: 4 },
          ],
        },
      ]),
    ).toEqual([
      { id: 'one', rank: 1 },
      { id: 'two', rank: 2 },
      { id: 'three', rank: 4 },
    ]);
  });

  test('returns an empty array when pages are missing', () => {
    expect(flattenInfiniteQueryPages(undefined)).toEqual([]);
  });
});
