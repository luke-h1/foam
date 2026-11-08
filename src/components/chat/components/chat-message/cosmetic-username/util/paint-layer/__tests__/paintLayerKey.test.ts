import { makeLayer } from '@app/components/chat/components/chat-message/cosmetic-username/util/paint-css/__fixtures__/paintCss.fixture';

import { withPaintLayerKeys } from '../paintLayerKey';

const keysOf = (angles: number[]) =>
  withPaintLayerKeys(angles.map(angle => makeLayer({ angle }))).map(
    entry => entry.key,
  );

describe('withPaintLayerKeys', () => {
  test('gives every layer a unique key, even when two layers are identical', () => {
    expect(new Set(keysOf([45, 90, 45])).size).toBe(3);
  });

  test('gives the same layers the same keys on a new paint object', () => {
    expect(keysOf([45, 90, 45])).toEqual(keysOf([45, 90, 45]));
  });

  test('keeps the earlier keys when a duplicate layer is appended', () => {
    expect(keysOf([45, 90, 45]).slice(0, 2)).toEqual(keysOf([45, 90]));
  });

  test('keeps each layer and its original index beside its key', () => {
    const layers = [makeLayer({ angle: 45 }), makeLayer({ angle: 90 })];

    expect(
      withPaintLayerKeys(layers).map(({ layer, layerIndex }) => ({
        layer,
        layerIndex,
      })),
    ).toEqual([
      { layer: layers[0], layerIndex: 0 },
      { layer: layers[1], layerIndex: 1 },
    ]);
  });
});
