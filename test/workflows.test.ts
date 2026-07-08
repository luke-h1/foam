import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { applyEnvironmentLabelsToChangelogHeadings } from '../scripts/workflows/changelog-headings';
import { normalizeChangelogFile } from '../scripts/workflows/changelog-headings-cli';
import {
  compareVersions,
  type GitCliffContext,
  parseReleaseTag,
  planPerEnvironmentSections,
  type ReleaseTag,
  rewritePerEnvironmentSections,
  type VersionPlan,
} from '../scripts/workflows/changelog-per-env';
import {
  buildChatPerformanceComment,
  buildCurrentTable,
  buildHighlightedSummary,
  readCurrentEntries,
  writeChatPerformanceComment,
} from '../scripts/workflows/chat-performance-comment';
import { getCommandErrorMessage } from '../scripts/workflows/github-actions';
import {
  compareFingerprints,
  decideDeployType,
  getCriticalOtaIndexCachePath,
  getFinalReleaseTag,
  getFingerprintCachePrefix,
  getOtaUpdateIdsCachePrefix,
  getPreliminaryReleaseTag,
  parsePublishedUpdateJson,
} from '../scripts/workflows/otaOrNativeDeployDecision';
import {
  parseCurrentRolloutPercentage,
  validateTargetPercentage,
} from '../scripts/workflows/otaRolloutPercentage';
import {
  requireBucketName,
  restoreEntries,
  type S3Copier,
  saveEntries,
} from '../scripts/workflows/s3Cache';
import {
  appendVariant,
  getVariantMeta,
  ignoreTagsPattern,
  isVariant,
  sentryDistFor,
  variantLabel,
} from '../scripts/workflows/variant';

function createMemoryCopier(remotes: string[] = []): {
  copier: S3Copier;
  uploads: { local: string; remote: string }[];
} {
  const available = new Set(remotes);
  const uploads: { local: string; remote: string }[] = [];

  return {
    uploads,
    copier: {
      download: source => available.has(source),
      upload: (local, remote) => {
        uploads.push({ local, remote });
      },
    },
  };
}

describe('otaOrNativeDeployDecision', () => {
  describe('getFingerprintCachePrefix', () => {
    test('builds the branch and variant scoped S3 prefix', () => {
      expect(
        getFingerprintCachePrefix({
          bucket: 'foam-release-cache',
          branch: 'main',
          variant: 'production',
        }),
      ).toBe('s3://foam-release-cache/fingerprints/main/production');
    });

    test('escapes branch names so each branch remains one S3 path segment', () => {
      expect(
        getFingerprintCachePrefix({
          bucket: 'foam-release-cache',
          branch: 'feature/ota-cache',
          variant: 'testflight',
        }),
      ).toBe(
        's3://foam-release-cache/fingerprints/feature%2Fota-cache/testflight',
      );
    });
  });

  describe('getCriticalOtaIndexCachePath', () => {
    test('builds the variant scoped S3 path', () => {
      expect(
        getCriticalOtaIndexCachePath({
          bucket: 'foam-release-cache',
          variant: 'production',
        }),
      ).toBe('s3://foam-release-cache/ota-critical-index/production/index');
    });
  });

  describe('getOtaUpdateIdsCachePrefix', () => {
    test('builds the variant scoped S3 prefix', () => {
      expect(
        getOtaUpdateIdsCachePrefix({
          bucket: 'foam-release-cache',
          variant: 'production',
        }),
      ).toBe('s3://foam-release-cache/ota-update-ids/production');
    });
  });

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

    test('uses the app version as the preliminary production native tag', () => {
      expect(getPreliminaryReleaseTag('1.2.3', 'build', 'production')).toBe(
        '1.2.3',
      );
    });

    test('uses variant scoped preliminary native tags for non-production variants', () => {
      expect(getPreliminaryReleaseTag('1.2.3', 'build', 'internal')).toBe(
        '1.2.3-internal',
      );
    });

    test('uses ota-pending for final ota releases because ota tags are not tracked', () => {
      expect(
        getFinalReleaseTag({
          deployType: 'ota',
          variant: 'production',
          version: '1.2.3',
          runNumber: 45,
        }),
      ).toBe('ota-pending');
    });

    test('does not variant scope final ota tags because ota tags are not tracked', () => {
      expect(
        getFinalReleaseTag({
          deployType: 'ota',
          variant: 'internal',
          version: '1.2.3',
          runNumber: 45,
        }),
      ).toBe('ota-pending');
    });

    test('uses the app version for final production native tags', () => {
      expect(
        getFinalReleaseTag({
          deployType: 'build',
          variant: 'production',
          version: '1.2.3',
          runNumber: 45,
        }),
      ).toBe('1.2.3');
    });

    test('uses variant scoped final native tags for non-production variants', () => {
      expect(
        getFinalReleaseTag({
          deployType: 'build',
          variant: 'testflight',
          version: '1.2.3',
          runNumber: 45,
        }),
      ).toBe('1.2.3-testflight');
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

describe('otaRolloutPercentage', () => {
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

describe('changelog headings', () => {
  test('adds environment labels for generated release headings', () => {
    const source = [
      '# Changelog',
      '',
      '## 1.2.3',
      '### Changes',
      '- changelog item',
      '## 1.2.3-internal',
      '### Changes',
      '- internal changelog item',
      '## 1.2.3-testflight',
      '### Changes',
      '- testflight changelog item',
      '## 1.2.3-preview',
      '### Changes',
      '- preview changelog item',
      '',
      '## 1.2.2',
      '- old changelog item',
    ].join('\n');

    expect(applyEnvironmentLabelsToChangelogHeadings(source)).toEqual(
      [
        '# Changelog',
        '',
        '## 1.2.3 (Production)',
        '### Changes',
        '- changelog item',
        '## 1.2.3 (Internal)',
        '### Changes',
        '- internal changelog item',
        '## 1.2.3 (TestFlight)',
        '### Changes',
        '- testflight changelog item',
        '## 1.2.3 (Preview)',
        '### Changes',
        '- preview changelog item',
        '',
        '## 1.2.2 (Production)',
        '- old changelog item',
      ].join('\n'),
    );
  });

  test('leaves non-version headings untouched', () => {
    const source = [
      '# Changelog',
      '',
      '## [unreleased]',
      '### Changes',
      '- local item',
      '### Notes',
      '- details',
    ].join('\n');

    expect(applyEnvironmentLabelsToChangelogHeadings(source)).toEqual(source);
  });

  test('normalizes version headings that include a leading v', () => {
    expect(applyEnvironmentLabelsToChangelogHeadings('## v1.2.3\n')).toEqual(
      '## 1.2.3 (Production)',
    );
  });

  test('preserves already labeled environment headings', () => {
    expect(
      applyEnvironmentLabelsToChangelogHeadings(
        [
          '# Changelog',
          '## 1.2.3 (Internal)',
          '## 1.2.3-testflight',
          '## 1.2.2 (Production)',
          '## 1.2.2',
        ].join('\n'),
      ),
    ).toEqual(
      [
        '# Changelog',
        '## 1.2.3 (Internal)',
        '## 1.2.3 (TestFlight)',
        '## 1.2.2 (Production)',
        '## 1.2.2 (Production)',
      ].join('\n'),
    );
  });

  test('is idempotent on already normalized content', () => {
    const source = ['## 1.2.3 (Internal)', '## 1.2.2-testflight'].join('\n');

    const normalized = applyEnvironmentLabelsToChangelogHeadings(source);

    expect(applyEnvironmentLabelsToChangelogHeadings(normalized)).toEqual(
      normalized,
    );
  });
});

describe('changelog generation', () => {
  test('normalizes generated changelog markdown written to a file', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'foam-changelog-generation-'));
    const changelogPath = join(tempDir, 'CHANGELOG.md');
    const generatedChangelog = [
      '# Changelog',
      '',
      '## 1.0.0-internal',
      '### Added',
      '- internal-only item',
      '## 1.0.0-testflight',
      '### Fixed',
      '- testflight item',
      '## 1.0.0',
      '### Changed',
      '- production item',
      '## 1.0.0-preview',
      '### Fixed',
      '- preview item',
      '## [Unreleased]',
      '- future change',
    ].join('\n');
    const expectedChangelog = [
      '# Changelog',
      '',
      '## 1.0.0 (Internal)',
      '### Added',
      '- internal-only item',
      '## 1.0.0 (TestFlight)',
      '### Fixed',
      '- testflight item',
      '## 1.0.0 (Production)',
      '### Changed',
      '- production item',
      '## 1.0.0 (Preview)',
      '### Fixed',
      '- preview item',
      '## [Unreleased]',
      '- future change',
    ].join('\n');

    try {
      writeFileSync(changelogPath, generatedChangelog, 'utf8');
      const normalized = normalizeChangelogFile(changelogPath);

      expect(normalized).toEqual(expectedChangelog);
      expect(readFileSync(changelogPath, 'utf8')).toEqual(expectedChangelog);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('is stable when run over an already generated changelog file', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'foam-changelog-generation-'));
    const changelogPath = join(tempDir, 'CHANGELOG.md');
    const generatedChangelog = [
      '# Changelog',
      '',
      '## 1.0.0 (Internal)',
      '### Added',
      '- already normalized',
    ].join('\n');

    try {
      writeFileSync(changelogPath, generatedChangelog, 'utf8');
      const normalized = normalizeChangelogFile(changelogPath);

      expect(normalized).toEqual(generatedChangelog);
      expect(readFileSync(changelogPath, 'utf8')).toEqual(generatedChangelog);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('changelog per-environment sections', () => {
  const RELEASE_TAGS: ReleaseTag[] = [
    { tag: '0.0.9', version: '0.0.9', environment: 'production', commit: 'c0' },
    {
      tag: '1.0.0-testflight',
      version: '1.0.0',
      environment: 'testflight',
      commit: 'c1',
    },
    {
      tag: '1.0.0-internal',
      version: '1.0.0',
      environment: 'internal',
      commit: 'c1',
    },
    { tag: '1.0.0', version: '1.0.0', environment: 'production', commit: 'c2' },
    { tag: '1.0.1', version: '1.0.1', environment: 'production', commit: 'c3' },
    {
      tag: '1.0.1-testflight',
      version: '1.0.1',
      environment: 'testflight',
      commit: 'c4',
    },
    {
      tag: '1.0.1-internal',
      version: '1.0.1',
      environment: 'internal',
      commit: 'c4',
    },
  ];

  function fakeGitCliffContext(
    commitOrder: string[],
    releaseTags: ReleaseTag[],
  ): GitCliffContext {
    const indexOf = (commit: string): number => commitOrder.indexOf(commit);
    return {
      headCommit: () => commitOrder[commitOrder.length - 1] ?? '',
      listReleaseTags: () => releaseTags,
      listAllTagCommits: () =>
        releaseTags.map(tag => ({ tag: tag.tag, commit: tag.commit })),
      isAncestor: (ancestor, descendant) =>
        indexOf(ancestor) <= indexOf(descendant),
      renderRange: (baselineCommit, headCommit, tag) => {
        if (indexOf(headCommit) <= indexOf(baselineCommit)) {
          return '';
        }
        return `## ${tag}\n\n### Test\n\n- ${tag} content`;
      },
    };
  }

  test('parses release tags into version and environment', () => {
    expect(parseReleaseTag('1.0.1')).toEqual({
      tag: '1.0.1',
      version: '1.0.1',
      environment: 'production',
    });
    expect(parseReleaseTag('1.0.1-internal')).toEqual({
      tag: '1.0.1-internal',
      version: '1.0.1',
      environment: 'internal',
    });
    expect(parseReleaseTag('v0.0.37')).toEqual({
      tag: 'v0.0.37',
      version: '0.0.37',
      environment: 'production',
    });
    expect(parseReleaseTag('ota-deadbeef')).toEqual(null);
  });

  test('orders versions numerically rather than lexically', () => {
    expect(compareVersions('0.0.42', '1.0.0')).toBeLessThan(0);
    expect(compareVersions('1.0.10', '1.0.2')).toBeGreaterThan(0);
    expect(compareVersions('1.0.1', '1.0.1')).toEqual(0);
  });

  test('plans one section per channel, baselined against the channel below', () => {
    const plans = planPerEnvironmentSections(
      RELEASE_TAGS,
      fakeGitCliffContext(['c0', 'c1', 'c2', 'c3', 'c4'], RELEASE_TAGS)
        .isAncestor,
    );

    expect(plans).toEqual<VersionPlan[]>([
      {
        version: '1.0.0',
        sections: [
          {
            tag: '1.0.0',
            environment: 'production',
            headCommit: 'c2',
            baselineCommit: 'c0',
            baselineDescription: 'the 0.0.9 release',
          },
          {
            tag: '1.0.0-testflight',
            environment: 'testflight',
            headCommit: 'c1',
            baselineCommit: 'c2',
            baselineDescription: 'the Production build',
          },
          {
            tag: '1.0.0-internal',
            environment: 'internal',
            headCommit: 'c1',
            baselineCommit: 'c1',
            baselineDescription: 'the TestFlight build',
          },
        ],
      },
      {
        version: '1.0.1',
        sections: [
          {
            tag: '1.0.1',
            environment: 'production',
            headCommit: 'c3',
            baselineCommit: 'c2',
            baselineDescription: 'the 1.0.0 release',
          },
          {
            tag: '1.0.1-testflight',
            environment: 'testflight',
            headCommit: 'c4',
            baselineCommit: 'c3',
            baselineDescription: 'the Production build',
          },
          {
            tag: '1.0.1-internal',
            environment: 'internal',
            headCommit: 'c4',
            baselineCommit: 'c4',
            baselineDescription: 'the TestFlight build',
          },
        ],
      },
    ]);
  });

  test('rewrites collapsed sections into full per-channel sections with placeholders', () => {
    const generated = [
      '# Changelog',
      '',
      '## 1.0.1',
      '### Collapsed',
      '- collapsed 1.0.1 body',
      '## 1.0.0-testflight',
      '### Collapsed',
      '- collapsed 1.0.0 body',
      '## 0.0.9',
      '### Fixed',
      '- single channel item',
      '## ota-deadbeef',
      '### OTA',
      '- ota item',
    ].join('\n');

    const rewritten = rewritePerEnvironmentSections(
      generated,
      fakeGitCliffContext(['c0', 'c1', 'c2', 'c3', 'c4'], RELEASE_TAGS),
    );

    expect(rewritten).toEqual(
      [
        '# Changelog',
        '',
        '## 1.0.1',
        '',
        '### Test',
        '',
        '- 1.0.1 content',
        '',
        '## 1.0.1-testflight',
        '',
        '### Test',
        '',
        '- 1.0.1-testflight content',
        '',
        '## 1.0.1-internal',
        '',
        '_No changes in this build beyond the TestFlight build._',
        '',
        '## 1.0.0',
        '',
        '### Test',
        '',
        '- 1.0.0 content',
        '',
        '## 1.0.0-testflight',
        '',
        '_No changes in this build beyond the Production build._',
        '',
        '## 1.0.0-internal',
        '',
        '_No changes in this build beyond the TestFlight build._',
        '',
        '## 0.0.9',
        '### Fixed',
        '- single channel item',
        '## ota-deadbeef',
        '### OTA',
        '- ota item',
      ].join('\n'),
    );
  });

  test('leaves the changelog untouched when no version reached two channels', () => {
    const singleChannelTags: ReleaseTag[] = [
      {
        tag: '0.0.9',
        version: '0.0.9',
        environment: 'production',
        commit: 'c0',
      },
      {
        tag: '0.0.10',
        version: '0.0.10',
        environment: 'production',
        commit: 'c1',
      },
    ];
    const generated = [
      '# Changelog',
      '',
      '## 0.0.10',
      '### Fixed',
      '- a fix',
      '## 0.0.9',
      '### Fixed',
      '- older fix',
    ].join('\n');

    const rewritten = rewritePerEnvironmentSections(
      generated,
      fakeGitCliffContext(['c0', 'c1'], singleChannelTags),
    );

    expect(rewritten).toEqual(generated);
  });
});

describe('s3Cache', () => {
  describe('requireBucketName', () => {
    test('accepts a bare bucket name', () => {
      expect(() => requireBucketName('foam-release-cache')).not.toThrow();
    });

    test('rejects an s3 uri', () => {
      expect(() => requireBucketName('s3://foam-release-cache')).toThrow(
        'Expected an S3 bucket name',
      );
    });

    test('rejects a value containing a path segment', () => {
      expect(() =>
        requireBucketName('foam-release-cache/fingerprints'),
      ).toThrow('Expected an S3 bucket name');
    });

    test('rejects an empty value', () => {
      expect(() => requireBucketName('')).toThrow('Expected an S3 bucket name');
    });
  });

  describe('restoreEntries', () => {
    test('counts only the entries the copier could download', () => {
      const { copier } = createMemoryCopier(['s3://bucket/prefix/ios']);

      expect(
        restoreEntries(copier, [
          { remote: 's3://bucket/prefix/ios', local: '/tmp/ios' },
          { remote: 's3://bucket/prefix/android', local: '/tmp/android' },
        ]),
      ).toBe(1);
    });
  });

  describe('saveEntries', () => {
    test('uploads existing files and throws when a file is missing by default', () => {
      const dir = mkdtempSync(join(tmpdir(), 'foam-s3-'));
      const iosPath = join(dir, 'ios');
      const androidPath = join(dir, 'android');

      try {
        writeFileSync(iosPath, 'ios-hash\n', 'utf8');
        const { copier, uploads } = createMemoryCopier();

        saveEntries(copier, [{ local: iosPath, remote: 's3://bucket/ios' }]);
        expect(uploads).toEqual([
          { local: iosPath, remote: 's3://bucket/ios' },
        ]);

        expect(() =>
          saveEntries(copier, [
            { local: androidPath, remote: 's3://bucket/android' },
          ]),
        ).toThrow('Cache file does not exist');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    test('skips missing files when onMissing is skip', () => {
      const dir = mkdtempSync(join(tmpdir(), 'foam-s3-'));

      try {
        const { copier, uploads } = createMemoryCopier();

        saveEntries(
          copier,
          [{ local: join(dir, 'android'), remote: 's3://bucket/android' }],
          { onMissing: 'skip' },
        );

        expect(uploads).toEqual([]);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

describe('variant', () => {
  test('maps each variant to its Sentry dist', () => {
    expect(sentryDistFor('production')).toBe('foam-tv');
    expect(sentryDistFor('internal')).toBe('foam-tv-internal');
    expect(sentryDistFor('testflight')).toBe('foam-tv-testflight');
  });

  test('maps each variant to its release label', () => {
    expect(variantLabel('production')).toBe('Production');
    expect(variantLabel('testflight')).toBe('TestFlight');
    expect(variantLabel('preview')).toBe('Preview');
  });

  test('appends the tag suffix only for non-production variants', () => {
    expect(appendVariant('1.2.3', 'production')).toBe('1.2.3');
    expect(appendVariant('1.2.3', 'internal')).toBe('1.2.3-internal');
    expect(appendVariant('1.2.3', 'preview')).toBe('1.2.3-preview');
  });

  test('recognises known variants and rejects unknown ones', () => {
    expect(isVariant('production')).toBe(true);
    expect(isVariant('e2e')).toBe(false);
  });

  test('throws for an unsupported variant', () => {
    expect(() => getVariantMeta('e2e')).toThrow('Unsupported variant: e2e');
  });

  describe('ignoreTagsPattern', () => {
    test('ignores every other suffixed variant for a production release', () => {
      expect(ignoreTagsPattern('1.2.3', 'production')).toBe(
        '^1\\.2\\.3-(internal|testflight|preview)$',
      );
    });

    test('excludes the release variant itself', () => {
      expect(ignoreTagsPattern('1.2.3', 'internal')).toBe(
        '^1\\.2\\.3-(testflight|preview)$',
      );
      expect(ignoreTagsPattern('1.2.3', 'testflight')).toBe(
        '^1\\.2\\.3-(internal|preview)$',
      );
    });
  });
});

describe('getCommandErrorMessage', () => {
  test('prefers a trimmed stderr when present', () => {
    const error = Object.assign(new Error('boom'), {
      stderr: '  detailed failure  ',
    });

    expect(getCommandErrorMessage(error)).toBe('detailed failure');
  });

  test('falls back to the error message when stderr is empty', () => {
    const error = Object.assign(new Error('plain message'), { stderr: '' });

    expect(getCommandErrorMessage(error)).toBe('plain message');
  });

  test('returns a generic message for non-Error values', () => {
    expect(getCommandErrorMessage('weird')).toBe('Unknown command failure');
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
