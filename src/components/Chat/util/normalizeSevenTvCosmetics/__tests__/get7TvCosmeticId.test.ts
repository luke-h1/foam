import { get7TvCosmeticId } from '../get7TvCosmeticId';

describe('get7TvCosmeticId', () => {
  test('returns id when not zero', () => {
    expect(get7TvCosmeticId({ id: 'abc123' })).toBe('abc123');
    expect(get7TvCosmeticId({ id: 'abc123', ref_id: 'ref' })).toBe('abc123');
  });

  test('returns ref_id when id is zero string', () => {
    const zeroId = '00000000000000000000000000';
    expect(get7TvCosmeticId({ id: zeroId, ref_id: 'actual-id' })).toBe(
      'actual-id',
    );
  });

  test('returns id when id is zero but no ref_id', () => {
    const zeroId = '00000000000000000000000000';
    expect(get7TvCosmeticId({ id: zeroId })).toBe(zeroId);
  });
});
