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
import {
  buildChatPerformanceComment,
  buildCurrentTable,
  buildHighlightedSummary,
  readCurrentEntries,
  writeChatPerformanceComment,
} from '../scripts/workflows/chat-performance-comment';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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

describe('chat performance comment workflow', () => {
  test('ignores reassure metadata rows when reading current measurements', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'foam-reassure-'));
    const perfPath = join(tempDir, 'current.perf');

    try {
      writeFileSync(
        perfPath,
        [
          JSON.stringify({ metadata: { version: 1 } }),
          JSON.stringify({
            name: 'renders rows',
            type: 'render',
            runs: 3,
            meanDuration: 12.345,
            stdevDuration: 1.234,
            meanCount: 2,
          }),
          '',
        ].join('\n'),
        'utf8',
      );

      expect(readCurrentEntries(perfPath)).toEqual([
        {
          name: 'renders rows',
          type: 'render',
          runs: 3,
          meanDuration: 12.345,
          stdevDuration: 1.234,
          meanCount: 2,
        },
      ]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('formats an empty current table with a plain fallback', () => {
    expect(buildCurrentTable([])).toBe(
      'No Reassure measurements were written.',
    );
  });

  test('renders current measurements as a syntax-highlighted diff block', () => {
    const red = '\u{1F534}';
    const green = '\u{1F7E2}';
    const yellow = '\u{1F7E1}';
    const table = buildCurrentTable(
      [
        {
          name: 'slower rows',
          type: 'render',
          runs: 3,
          meanDuration: 12.345,
          stdevDuration: 1.234,
        },
        {
          name: 'faster rows',
          type: 'render',
          runs: 3,
          meanDuration: 8.345,
          stdevDuration: 0.234,
        },
        {
          name: 'noisy rows',
          type: 'render',
          runs: 3,
          meanDuration: 10,
          stdevDuration: 2,
        },
      ],
      [
        `| slower rows | render | 10.0 ms -> 12.0 ms ${red} |`,
        `| faster rows | render | 12.0 ms -> 10.0 ms ${green} |`,
        `| noisy rows | render | noisy ${yellow} |`,
      ].join('\n'),
    );

    expect(table).toContain('```diff');
    expect(table).toContain('  Scenario');
    expect(table).toContain('Typical time swing');
    expect(table).toContain('- slower rows');
    expect(table).toContain('+ faster rows');
    expect(table).toContain('! noisy rows');
  });

  test('colors measurements against the base run when the report has no marker', () => {
    const table = buildCurrentTable(
      [
        {
          name: 'slower rows',
          type: 'render',
          runs: 3,
          meanDuration: 12,
        },
        {
          name: 'faster rows',
          type: 'render',
          runs: 3,
          meanDuration: 8,
        },
      ],
      '',
      [
        {
          name: 'slower rows',
          type: 'render',
          runs: 3,
          meanDuration: 10,
        },
        {
          name: 'faster rows',
          type: 'render',
          runs: 3,
          meanDuration: 10,
        },
      ],
    );

    expect(table).toContain('- slower rows');
    expect(table).toContain('+ faster rows');
  });

  test('builds a failure comment with current measurements and report details', () => {
    expect(
      buildChatPerformanceComment({
        entries: [
          {
            name: 'renders rows',
            type: 'render',
            runs: 3,
            meanDuration: 12.345,
            stdevDuration: 1.234,
            meanCount: 2,
          },
        ],
        report: 'Regression detected',
        runUrl: 'https://github.com/luke-h1/foam/actions/runs/1',
        status: 'failure',
      }),
    ).toContain('  renders rows  12.35ms');
  });

  test('builds a syntax-highlighted diff summary for the comment', () => {
    const red = '\u{1F534}';
    const green = '\u{1F7E2}';
    const yellow = '\u{1F7E1}';

    expect(
      buildHighlightedSummary({
        entries: [
          {
            name: 'renders rows',
            type: 'render',
            runs: 3,
            meanDuration: 12.345,
          },
        ],
        report: [
          '### Significant Changes To Duration',
          `| slower rows | render | 10.0 ms -> 12.0 ms ${red} |`,
          `| faster rows | render | 12.0 ms -> 10.0 ms ${green} |`,
          '## Warnings',
          `- ${yellow} noisy benchmark`,
        ].join('\n'),
        status: 'success',
      }),
    ).toBe(
      [
        '```diff',
        '+ Performance job passed',
        '! Reassure scenarios measured: 1',
        '! ### Significant Changes To Duration',
        `- | slower rows | render | 10.0 ms -> 12.0 ms ${red} |`,
        `+ | faster rows | render | 12.0 ms -> 10.0 ms ${green} |`,
        '! ## Warnings',
        `! - ${yellow} noisy benchmark`,
        '```',
      ].join('\n'),
    );
  });

  test('includes the highlighted result before the measurement table', () => {
    const comment = buildChatPerformanceComment({
      entries: [],
      report: '',
      runUrl: '',
      status: 'failure',
    });

    expect(comment).toContain(
      [
        '### Highlighted result',
        '```diff',
        '- Performance job failed',
        '! Reassure scenarios measured: 0',
        '```',
      ].join('\n'),
    );
  });

  test('writes the comment to a nested output path', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'foam-reassure-'));
    const reassureDir = join(tempDir, '.reassure');
    const outputPath = join(tempDir, 'nested', 'pr-comment.md');

    try {
      mkdirSync(reassureDir);
      writeFileSync(
        join(reassureDir, 'current.perf'),
        JSON.stringify({
          name: 'renders rows',
          type: 'render',
          runs: 1,
          meanDuration: 2,
        }),
        'utf8',
      );
      writeFileSync(join(reassureDir, 'output.md'), 'Comparison', 'utf8');

      writeChatPerformanceComment({
        currentPath: join(reassureDir, 'current.perf'),
        outputPath,
        reportPath: join(reassureDir, 'output.md'),
        runUrl: '',
        status: 'success',
      });

      expect(readFileSync(outputPath, 'utf8')).toContain(
        '## Chat Performance passed',
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
