import { readFileSync, writeFileSync } from 'node:fs';

import { applyEnvironmentLabelsToChangelogHeadings } from './changelog-headings';

export function normalizeChangelogFile(changelogPath: string): string {
  const source = readFileSync(changelogPath, 'utf8');
  const normalized = applyEnvironmentLabelsToChangelogHeadings(source);

  writeFileSync(changelogPath, normalized, 'utf8');

  return normalized;
}

function main(): void {
  const changelogPath = process.argv[2];
  if (changelogPath == null || changelogPath === '') {
    console.error('Expected a path to CHANGELOG.md');
    process.exit(1);
  }

  normalizeChangelogFile(changelogPath);
}

if (require.main === module) {
  main();
}
