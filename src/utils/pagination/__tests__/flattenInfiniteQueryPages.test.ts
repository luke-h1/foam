import { flattenInfiniteQueryPages } from '../flattenInfiniteQueryPages';

describe('flattenInfiniteQueryPages', () => {
  it('flattens page data and removes empty items', () => {
    expect(
      flattenInfiniteQueryPages([
        { data: ['one', undefined, 'two'] },
        undefined,
        { data: [null, 'three'] },
      ]),
    ).toEqual(['one', 'two', 'three']);
  });

  it('returns an empty array when pages are missing', () => {
    expect(flattenInfiniteQueryPages(undefined)).toEqual([]);
  });
});
