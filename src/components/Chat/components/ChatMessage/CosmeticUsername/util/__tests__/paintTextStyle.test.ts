import { buildPaintUsernameTextStyle } from '../paintTextStyle';
import type { PaintData } from '@app/utils/color/seventv-ws-service';

function makeCollection<T>(items: T[]): Record<string | number, T | number> {
  const col: Record<string | number, T | number> = { length: items.length };
  items.forEach((item, i) => { col[i] = item; });
  return col as any;
}

const basePaint: PaintData = {
  id: 'test',
  name: 'Test',
  function: 'LINEAR_GRADIENT',
  angle: 0,
  color: null,
  shape: 'circle',
  repeat: false,
  image_url: '',
  stops: makeCollection([]) as any,
  layers: makeCollection([]) as any,
  shadows: makeCollection([]) as any,
  textStyle: null,
} as any;

describe('buildPaintUsernameTextStyle', () => {
  it('returns empty object when textStyle is null', () => {
    expect(buildPaintUsernameTextStyle(basePaint)).toEqual({});
  });

  it('maps textStyle.weight to fontWeight string', () => {
    const paint = { ...basePaint, textStyle: { weight: 7 } } as any;
    const style = buildPaintUsernameTextStyle(paint);
    expect(style.fontWeight).toBe('700');
  });

  it('maps textStyle.transform to textTransform', () => {
    const paint = { ...basePaint, textStyle: { transform: 'uppercase' } } as any;
    const style = buildPaintUsernameTextStyle(paint);
    expect(style.textTransform).toBe('uppercase');
  });

  it('maps textStyle.stroke to text shadow fields', () => {
    const paint = {
      ...basePaint,
      textStyle: { stroke: { color: 0xff0000ff as any, width: 3 } },
    } as any;
    const style = buildPaintUsernameTextStyle(paint);
    expect(style.textShadowRadius).toBe(3);
    expect(style.textShadowColor).toMatch(/^rgba\(/);
    expect(style.textShadowOffset).toEqual({ width: 0, height: 0 });
  });

  it('ignores stroke when width is 0', () => {
    const paint = {
      ...basePaint,
      textStyle: { stroke: { color: 0xff0000ff as any, width: 0 } },
    } as any;
    const style = buildPaintUsernameTextStyle(paint);
    expect(style.textShadowRadius).toBeUndefined();
  });

  it('applies the first textStyle shadow', () => {
    const paint = {
      ...basePaint,
      textStyle: {
        shadows: makeCollection([
          { color: 0x0000ffff as any, x_offset: 1, y_offset: 2, radius: 4 },
        ]),
      },
    } as any;
    const style = buildPaintUsernameTextStyle(paint);
    expect(style.textShadowOffset).toEqual({ width: 1, height: 2 });
    expect(style.textShadowRadius).toBe(4);
  });

  it('applies all fields together', () => {
    const paint = {
      ...basePaint,
      textStyle: {
        weight: 8,
        transform: 'lowercase' as const,
        shadows: makeCollection([
          { color: 0xffffffff as any, x_offset: 0, y_offset: 0, radius: 2 },
        ]),
      },
    } as any;
    const style = buildPaintUsernameTextStyle(paint);
    expect(style.fontWeight).toBe('800');
    expect(style.textTransform).toBe('lowercase');
    expect(style.textShadowRadius).toBe(2);
  });
});
