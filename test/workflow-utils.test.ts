import {
  compareFingerprints,
  decideDeployType,
  getFinalReleaseTag,
  getPreliminaryReleaseTag,
  parsePublishedUpdateJson,
} from '../scripts/workflows/deploy-ota-or-native-utils';
import {
  parseCurrentRolloutPercentage,
  validateTargetPercentage,
} from '../scripts/workflows/rollout-ota-utils';

describe('deploy-ota-or-native workflow utils', () => {
  describe('compareFingerprints', () => {
    test('marks first run as changed when no previous fingerprints exist', () => {
      expect(
        compareFingerprints(
          { ios: null, android: null },
          { ios: 'ios-a', android: 'android-a' },
        ),
      ).toBe(true);
    });

    test('returns false when both fingerprints match', () => {
      expect(
        compareFingerprints(
          { ios: 'ios-a', android: 'android-a' },
          { ios: 'ios-a', android: 'android-a' },
        ),
      ).toBe(false);
    });

    test('returns true when either fingerprint changes', () => {
      expect(
        compareFingerprints(
          { ios: 'ios-a', android: 'android-a' },
          { ios: 'ios-b', android: 'android-a' },
        ),
      ).toBe(true);
    });
  });

  describe('decideDeployType', () => {
    test('prefers manual ota selection', () => {
      expect(decideDeployType('ota', true)).toBe('ota');
    });

    test('prefers manual build selection', () => {
      expect(decideDeployType('build', false)).toBe('build');
    });

    test('chooses build when native fingerprints changed', () => {
      expect(decideDeployType('auto', true)).toBe('build');
    });

    test('chooses ota when native fingerprints did not change', () => {
      expect(decideDeployType('auto', false)).toBe('ota');
    });
  });

  describe('tag generation', () => {
    test('uses ota-pending as the preliminary ota tag', () => {
      expect(getPreliminaryReleaseTag('1.2.3', 'ota')).toBe('ota-pending');
    });

    test('uses the app version as the preliminary native tag', () => {
      expect(getPreliminaryReleaseTag('1.2.3', 'build')).toBe('1.2.3');
    });

    test('uses app version and workflow run for final ota tags', () => {
      expect(
        getFinalReleaseTag({
          deployType: 'ota',
          version: '1.2.3',
          runNumber: 45,
        }),
      ).toBe('ota-1.2.3-45');
    });

    test('uses the app version for final native tags', () => {
      expect(
        getFinalReleaseTag({
          deployType: 'build',
          version: '1.2.3',
          runNumber: 45,
        }),
      ).toBe('1.2.3');
    });
  });

  describe('parsePublishedUpdateJson', () => {
    test('extracts ios, android, and group ids from eas update json', () => {
      expect(
        parsePublishedUpdateJson(
          JSON.stringify([
            { id: 'ios-1', group: 'group-1', platform: 'ios' },
            { id: 'android-1', group: 'group-1', platform: 'android' },
          ]),
        ),
      ).toEqual({
        iosUpdateId: 'ios-1',
        androidUpdateId: 'android-1',
        updateGroupId: 'group-1',
      });
    });

    test('returns empty ids for invalid json', () => {
      expect(parsePublishedUpdateJson('not-json')).toEqual({
        iosUpdateId: '',
        androidUpdateId: '',
        updateGroupId: '',
      });
    });
  });
});

describe('rollout-ota workflow utils', () => {
  describe('parseCurrentRolloutPercentage', () => {
    test('extracts rollout percentage from eas update:view output', () => {
      expect(
        parseCurrentRolloutPercentage(`
Update group ID  abc123
Rollout Percentage  25%
        `),
      ).toBe('25');
    });

    test('returns null when no rollout percentage exists', () => {
      expect(parseCurrentRolloutPercentage('No rollout here')).toBeNull();
    });
  });

  describe('validateTargetPercentage', () => {
    test('accepts whole-number percentages in range', () => {
      expect(validateTargetPercentage('100')).toBe(100);
    });

    test('rejects non-integer input', () => {
      expect(() => validateTargetPercentage('12.5')).toThrow(
        'target_percentage must be an integer between 1 and 100.',
      );
    });

    test('rejects out-of-range input', () => {
      expect(() => validateTargetPercentage('0')).toThrow(
        'target_percentage must be an integer between 1 and 100.',
      );
    });
  });
});
