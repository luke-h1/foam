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
    it('marks first run as changed when no previous fingerprints exist', () => {
      expect(
        compareFingerprints(
          { ios: null, android: null },
          { ios: 'ios-a', android: 'android-a' },
        ),
      ).toBe(true);
    });

    it('returns false when both fingerprints match', () => {
      expect(
        compareFingerprints(
          { ios: 'ios-a', android: 'android-a' },
          { ios: 'ios-a', android: 'android-a' },
        ),
      ).toBe(false);
    });

    it('returns true when either fingerprint changes', () => {
      expect(
        compareFingerprints(
          { ios: 'ios-a', android: 'android-a' },
          { ios: 'ios-b', android: 'android-a' },
        ),
      ).toBe(true);
    });
  });

  describe('decideDeployType', () => {
    it('prefers manual ota selection', () => {
      expect(decideDeployType('ota', true)).toBe('ota');
    });

    it('prefers manual build selection', () => {
      expect(decideDeployType('build', false)).toBe('build');
    });

    it('chooses build when native fingerprints changed', () => {
      expect(decideDeployType('auto', true)).toBe('build');
    });

    it('chooses ota when native fingerprints did not change', () => {
      expect(decideDeployType('auto', false)).toBe('ota');
    });
  });

  describe('tag generation', () => {
    it('uses ota-pending as the preliminary ota tag', () => {
      expect(getPreliminaryReleaseTag('1.2.3', 'ota')).toBe('ota-pending');
    });

    it('uses the app version as the preliminary native tag', () => {
      expect(getPreliminaryReleaseTag('1.2.3', 'build')).toBe('1.2.3');
    });

    it('uses the update group id for final ota tags when present', () => {
      expect(
        getFinalReleaseTag({
          deployType: 'ota',
          version: '1.2.3',
          updateGroupId: 'group-123',
          runNumber: 45,
        }),
      ).toBe('ota-group-123');
    });

    it('falls back to version and run number for final ota tags', () => {
      expect(
        getFinalReleaseTag({
          deployType: 'ota',
          version: '1.2.3',
          updateGroupId: '',
          runNumber: 45,
        }),
      ).toBe('ota-1.2.3-45');
    });
  });

  describe('parsePublishedUpdateJson', () => {
    it('extracts ios, android, and group ids from eas update json', () => {
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

    it('returns empty ids for invalid json', () => {
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
    it('extracts rollout percentage from eas update:view output', () => {
      expect(
        parseCurrentRolloutPercentage(`
Update group ID  abc123
Rollout Percentage  25%
        `),
      ).toBe('25');
    });

    it('returns null when no rollout percentage exists', () => {
      expect(parseCurrentRolloutPercentage('No rollout here')).toBeNull();
    });
  });

  describe('validateTargetPercentage', () => {
    it('accepts whole-number percentages in range', () => {
      expect(validateTargetPercentage('100')).toBe(100);
    });

    it('rejects non-integer input', () => {
      expect(() => validateTargetPercentage('12.5')).toThrow(
        'target_percentage must be an integer between 1 and 100.',
      );
    });

    it('rejects out-of-range input', () => {
      expect(() => validateTargetPercentage('0')).toThrow(
        'target_percentage must be an integer between 1 and 100.',
      );
    });
  });
});
