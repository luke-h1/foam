import { compareVersions, isUpdateRequired } from '../compareVersions';

describe('compareVersions', () => {
  test('should return 0 when versions are equal', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('2.5.10', '2.5.10')).toBe(0);
    expect(compareVersions('0.0.1', '0.0.1')).toBe(0);
  });

  test('should return -1 when first version is less than second', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    expect(compareVersions('0.0.35', '0.0.36')).toBe(-1);
    expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
  });

  test('should return 1 when first version is greater than second', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    expect(compareVersions('0.0.36', '0.0.35')).toBe(1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
  });

  test('should handle versions with different number of parts', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0')).toBe(0);
    expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1.0.1', '1.0')).toBe(1);
    expect(compareVersions('2', '1.9.9')).toBe(1);
  });

  test('should handle single digit versions', () => {
    expect(compareVersions('1', '2')).toBe(-1);
    expect(compareVersions('2', '1')).toBe(1);
    expect(compareVersions('1', '1')).toBe(0);
  });
});

describe('isUpdateRequired', () => {
  test('should return true when current version is below minimum', () => {
    expect(isUpdateRequired('1.0.0', '2.0.0')).toBe(true);
    expect(isUpdateRequired('0.0.35', '0.0.36')).toBe(true);
    expect(isUpdateRequired('1.9.9', '2.0.0')).toBe(true);
  });

  test('should return false when current version equals minimum', () => {
    expect(isUpdateRequired('1.0.0', '1.0.0')).toBe(false);
    expect(isUpdateRequired('0.0.36', '0.0.36')).toBe(false);
  });

  test('should return false when current version is above minimum', () => {
    expect(isUpdateRequired('2.0.0', '1.0.0')).toBe(false);
    expect(isUpdateRequired('0.0.37', '0.0.36')).toBe(false);
    expect(isUpdateRequired('2.0.0', '1.9.9')).toBe(false);
  });

  test('should return false when currentVersion is null or undefined', () => {
    expect(isUpdateRequired(null, '1.0.0')).toBe(false);
    expect(isUpdateRequired(undefined, '1.0.0')).toBe(false);
  });

  test('should return false when minimumVersion is null or undefined', () => {
    expect(isUpdateRequired('1.0.0', null)).toBe(false);
    expect(isUpdateRequired('1.0.0', undefined)).toBe(false);
  });

  test('should return false when minimumVersion is empty string', () => {
    expect(isUpdateRequired('1.0.0', '')).toBe(false);
  });

  test('should return false when currentVersion is empty string', () => {
    expect(isUpdateRequired('', '1.0.0')).toBe(false);
  });

  test('should return false when both versions are empty', () => {
    expect(isUpdateRequired('', '')).toBe(false);
    expect(isUpdateRequired(null, null)).toBe(false);
    expect(isUpdateRequired(undefined, undefined)).toBe(false);
  });
});
