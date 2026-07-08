import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  createGitCliffContext,
  rewritePerEnvironmentSections,
} from './changelog-per-env';

function resolveGitCliffBin(): string {
  const fromEnv = process.env.GIT_CLIFF_BIN;
  if (fromEnv != null && fromEnv !== '' && existsSync(fromEnv)) {
    return fromEnv;
  }
  const cargoBin = join(homedir(), '.cargo', 'bin', 'git-cliff');
  if (existsSync(cargoBin)) {
    return cargoBin;
  }
  return 'git-cliff';
}

export function rewriteChangelogFile(
  changelogPath: string,
  currentTag: string | null,
): string {
  const source = readFileSync(changelogPath, 'utf8');
  const context = createGitCliffContext({
    gitCliffBin: resolveGitCliffBin(),
    configPath: process.env.CLIFF_CONFIG ?? 'cliff.toml',
    currentTag,
  });
  const rewritten = rewritePerEnvironmentSections(source, context);

  writeFileSync(changelogPath, rewritten, 'utf8');

  return rewritten;
}

function main(): void {
  const changelogPath = process.argv[2];
  if (changelogPath == null || changelogPath === '') {
    console.error('Expected a path to CHANGELOG.md');
    process.exit(1);
  }
  const currentTag = process.argv[3] ?? null;

  rewriteChangelogFile(changelogPath, currentTag);
}

if (require.main === module) {
  main();
}
