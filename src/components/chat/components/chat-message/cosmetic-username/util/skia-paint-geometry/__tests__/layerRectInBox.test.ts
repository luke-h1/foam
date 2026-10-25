import { type LayerRect, layerRectInBox } from '../layerRectInBox';

describe('layerRectInBox', () => {
  test('fills the box when position and size are absent', () => {
    expect(layerRectInBox(null, null, 200, 100)).toEqual<LayerRect>({
      x: 0,
      y: 0,
      width: 200,
      height: 100,
    });
  });

  test('offsets by (box - layer) * position like CSS background-position', () => {
    expect(layerRectInBox([0.5, 1], [0.5, 0.5], 200, 100)).toEqual<LayerRect>({
      x: 50,
      y: 50,
      width: 100,
      height: 50,
    });
  });
});
