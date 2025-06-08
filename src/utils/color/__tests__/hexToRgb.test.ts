import { hexToRgb } from '../hexToRgb';

describe('hexToRgb', () => {
  test('should convert valid 6-digit hex code to RGB', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('should convert valid 3-digit hex code to RGB', () => {
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#0F0')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#00F')).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('should handle hex codes without # prefix', () => {
    expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('F00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  test('should return null for invalid hex codes', () => {
    expect(hexToRgb('')).toBeNull();
    expect(hexToRgb('#')).toBeNull();
    expect(hexToRgb('#G')).toBeNull();
    expect(hexToRgb('#GGG')).toBeNull();
    expect(hexToRgb('#GGGGGG')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull(); // Too short
    expect(hexToRgb('#1234567')).toBeNull(); // Too long
  });

  test('should handle mixed case hex codes', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#Ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });
});
