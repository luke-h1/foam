import { getAnnouncementAccentColor } from '../getAnnouncementAccentColor';

describe('getAnnouncementAccentColor', () => {
  test('returns the primary accent when color is missing', () => {
    expect(getAnnouncementAccentColor()).toBe('#EB0400');
    expect(getAnnouncementAccentColor('')).toBe('#EB0400');
  });

  test('maps known announcement colors case-insensitively', () => {
    expect(getAnnouncementAccentColor('blue')).toBe('#1475E1');
    expect(getAnnouncementAccentColor('GREEN')).toBe('#00AD03');
    expect(getAnnouncementAccentColor('Orange')).toBe('#FF6905');
    expect(getAnnouncementAccentColor('purple')).toBe('#9147FF');
    expect(getAnnouncementAccentColor('PRIMARY')).toBe('#EB0400');
  });

  test('falls back to primary for unknown colors', () => {
    expect(getAnnouncementAccentColor('pink')).toBe('#EB0400');
    expect(getAnnouncementAccentColor('not-a-color')).toBe('#EB0400');
  });
});
