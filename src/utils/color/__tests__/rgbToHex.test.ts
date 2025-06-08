import { rgbToHex } from '../rgbToHex';

describe('rgbToHex', () => {
  test('should convert valid RGB string to hex', () => {
    expect(rgbToHex('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(rgbToHex('rgb(0, 255, 0)')).toBe('#00ff00');
    expect(rgbToHex('rgb(0, 0, 255)')).toBe('#0000ff');
    expect(rgbToHex('rgb(128, 128, 128)')).toBe('#808080');
  });

  test('should handle RGB values with spaces', () => {
    expect(rgbToHex('rgb( 255 , 0 , 0 )')).toBe('#ff0000');
    expect(rgbToHex('rgb(0, 255, 0 )')).toBe('#00ff00');
  });

  test('should handle invalid RGB values by defaulting to 255', () => {
    expect(rgbToHex('rgb(invalid, 0, 0)')).toBe('#ff0000');
    expect(rgbToHex('rgb(0, invalid, 0)')).toBe('#00ff00');
    expect(rgbToHex('rgb(0, 0, invalid)')).toBe('#0000ff');
  });

  test('should return the input string if it is not in RGB format', () => {
    expect(rgbToHex('#ff0000')).toBe('#ff0000');
    expect(rgbToHex('red')).toBe('red');
    expect(rgbToHex('rgb(255,0,0')).toBe('rgb(255,0,0');
    expect(rgbToHex('rgb(255,0,0)extra')).toBe('rgb(255,0,0)extra');
  });

  test('should handle RGB values with decimal points', () => {
    expect(rgbToHex('rgb(255.5, 0, 0)')).toBe('#ff0000');
    expect(rgbToHex('rgb(0, 255.9, 0)')).toBe('#00ff00');
  });
});
