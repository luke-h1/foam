import { setBoundedMapEntry } from '../setBoundedMapEntry';

function filledMap(size: number): Map<string, number> {
  return new Map(
    Array.from({ length: size }, (_, index) => [`k${index}`, index]),
  );
}

describe('setBoundedMapEntry', () => {
  test('drops the oldest key when a new key meets a full map', () => {
    const map = filledMap(3);

    setBoundedMapEntry(map, 'new', 9, 3);

    expect([...map.keys()]).toEqual(['k1', 'k2', 'new']);
  });

  test('drops a share of the oldest keys with a trim fraction', () => {
    const map = filledMap(10);

    setBoundedMapEntry(map, 'new', 9, 10, { trimFraction: 0.2 });

    expect([...map.keys()]).toEqual([
      'k2',
      'k3',
      'k4',
      'k5',
      'k6',
      'k7',
      'k8',
      'k9',
      'new',
    ]);
  });

  test('updates an existing key without an eviction', () => {
    const map = filledMap(3);

    setBoundedMapEntry(map, 'k0', 7, 3, { trimFraction: 0.5 });

    expect([...map.entries()]).toEqual([
      ['k0', 7],
      ['k1', 1],
      ['k2', 2],
    ]);
  });
});
