import { parsePreferencesPayload } from '@app/lib/icloud-sync';
import { initialPreferences } from '@app/store/preferenceStore';
import { logger } from '@app/utils/logger';

const warnSpy = jest.spyOn(logger.main, 'warn').mockImplementation(() => {});

beforeEach(() => {
  warnSpy.mockClear();
});

describe('parsePreferencesPayload', () => {
  test('restores a legacy blob missing a newly added field, filling it from defaults', () => {
    const { analyticsEnabled: _omitted, ...legacyBlob } = {
      ...initialPreferences,
      updatedAt: 123,
      chatTimestamps: true,
      blockedTerms: ['kappa'],
    };

    const result = parsePreferencesPayload(JSON.stringify(legacyBlob));

    expect(result).toEqual({
      ...initialPreferences,
      updatedAt: 123,
      chatTimestamps: true,
      blockedTerms: ['kappa'],
      analyticsEnabled: true,
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('returns a complete valid blob unchanged', () => {
    const blob = {
      ...initialPreferences,
      updatedAt: 456,
      analyticsEnabled: false,
    };

    const result = parsePreferencesPayload(JSON.stringify(blob));

    expect(result).toEqual(blob);
  });

  test('discards a blob whose existing field has the wrong type', () => {
    const result = parsePreferencesPayload(
      JSON.stringify({ ...initialPreferences, chatDelay: 'soon' }),
    );

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });

  test('discards a non-object payload', () => {
    expect(parsePreferencesPayload('[]')).toBeNull();
    expect(parsePreferencesPayload('42')).toBeNull();
  });

  test('returns null for empty or malformed JSON', () => {
    expect(parsePreferencesPayload(null)).toBeNull();
    expect(parsePreferencesPayload('')).toBeNull();
    expect(parsePreferencesPayload('not json')).toBeNull();
  });
});
