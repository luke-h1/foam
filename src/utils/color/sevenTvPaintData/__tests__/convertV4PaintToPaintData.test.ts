// `shape` here is a GraphQL-codegen name from the 7TV schema, not a naming
// choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { PaintRadialGradientShape } from '@app/graphql/generated/gql';
import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintLayerData } from '@app/types/seventv/cosmetics';
import { convertV4PaintToPaintData } from '@app/utils/color/sevenTvPaintData/convertV4PaintToPaintData';
import type { SevenTvPaintSource } from '@app/utils/color/sevenTvPaintData/types';

const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };

const PACKED_RED = 0xff0000ff;
const PACKED_BLUE = 0x0000ffff;

describe('convertV4PaintToPaintData', () => {
  test('reverses v4 layer order so the topmost layer is listed first', () => {
    const source = {
      id: 'paint-1',
      name: 'Layered',
      data: {
        layers: [
          {
            id: 'layer-bottom',
            opacity: 1,
            ty: {
              __typename: 'PaintLayerTypeLinearGradient',
              angle: 90,
              repeating: false,
              stops: [
                { at: 0, color: RED },
                { at: 1, color: BLUE },
              ],
            },
          },
          {
            id: 'layer-top',
            opacity: 0.5,
            ty: {
              __typename: 'PaintLayerTypeRadialGradient',
              repeating: true,
              shape: PaintRadialGradientShape.Ellipse,
              stops: [
                { at: 0.25, color: BLUE },
                { at: 0.75, color: RED },
              ],
            },
          },
        ],
        shadows: [],
      },
    } satisfies SevenTvPaintSource;

    const paint = convertV4PaintToPaintData(source);

    expect(indexedCollectionToArray(paint.layers)).toEqual<PaintLayerData[]>([
      {
        function: 'RADIAL_GRADIENT',
        stops: {
          0: { at: 0.25, color: PACKED_BLUE },
          1: { at: 0.75, color: PACKED_RED },
          length: 2,
        },
        angle: 0,
        shape: 'ellipse',
        repeat: true,
        image_url: '',
        canvas_repeat: 'unset',
        at: null,
        size: [1, 1],
        opacity: 0.5,
      },
      {
        function: 'LINEAR_GRADIENT',
        stops: {
          0: { at: 0, color: PACKED_RED },
          1: { at: 1, color: PACKED_BLUE },
          length: 2,
        },
        angle: 90,
        shape: 'circle',
        repeat: false,
        image_url: '',
        canvas_repeat: 'unset',
        at: null,
        size: [1, 1],
        opacity: 1,
      },
    ]);
    expect(paint.color).toBeNull();
  });

  test('converts a single-colour layer to a two-stop gradient with its opacity', () => {
    const source = {
      id: 'paint-2',
      name: 'Solid',
      data: {
        layers: [
          {
            id: 'layer-solid',
            opacity: 0.25,
            ty: {
              __typename: 'PaintLayerTypeSingleColor',
              color: RED,
            },
          },
        ],
        shadows: [],
      },
    } satisfies SevenTvPaintSource;

    const paint = convertV4PaintToPaintData(source);

    expect(indexedCollectionToArray(paint.layers)).toEqual<PaintLayerData[]>([
      {
        function: 'LINEAR_GRADIENT',
        stops: {
          0: { at: 0, color: PACKED_RED },
          1: { at: 1, color: PACKED_RED },
          length: 2,
        },
        angle: 0,
        shape: 'circle',
        repeat: false,
        image_url: '',
        canvas_repeat: 'unset',
        at: null,
        size: [1, 1],
        opacity: 0.25,
      },
    ]);
    expect(paint.color).toBe(PACKED_RED);
  });
});
