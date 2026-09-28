/**
 * Every backticked source path in docs/ must resolve to a real file.
 *
 * The glossary and the ADRs are the map an agent reads before touching code.
 * A kebab-case rename pass once left 26 of CONTEXT.md's 40 pointers dead, all
 * of them silently, because nothing checked them.
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Only the docs that work as a live map of the code. The dated audit and plan
 * documents describe the codebase as it stood on their date, so a path that no
 * longer resolves is a correct historical record, not a broken pointer.
 */
const MAPPED_DOCS = ['docs/CONTEXT.md', 'docs/adr'];

// Paths named as prose about code that no longer exists, not as pointers.
const DELETED_ON_PURPOSE = new Set(['emoteResolutionDivergence.test.ts']);

const PATH_PATTERN = /`([A-Za-z0-9_./-]+\.tsx?)`/g;

// docs/ writes a path relative to one of these.
const ROOTS = ['', 'src/', 'scripts/', 'scripts/workflows/'];

function resolves(candidate: string): boolean {
  return ROOTS.some(root => existsSync(`${root}${candidate}`));
}

async function markdownFiles(target: string): Promise<string[]> {
  if (target.endsWith('.md')) {
    return [target];
  }

  const entries = await readdir(target, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(entry => {
      const full = join(target, entry.name);

      if (entry.isDirectory()) {
        return markdownFiles(full);
      }

      return Promise.resolve(entry.name.endsWith('.md') ? [full] : []);
    }),
  );

  return nested.flat();
}

async function main(): Promise<void> {
  const files = (await Promise.all(MAPPED_DOCS.map(markdownFiles))).flat();
  const dead: string[] = [];
  let checked = 0;

  for (const file of files) {
    const text = await readFile(file, 'utf8');

    for (const [, candidate] of text.matchAll(PATH_PATTERN)) {
      if (!candidate || DELETED_ON_PURPOSE.has(candidate)) {
        continue;
      }

      // A bare `foo.ts` in prose is a name, not a pointer.
      if (!candidate.includes('/')) {
        continue;
      }

      checked += 1;

      if (!resolves(candidate)) {
        dead.push(`${file}: ${candidate}`);
      }
    }
  }

  if (dead.length > 0) {
    console.error(`${dead.length} dead path(s) in docs:\n`);
    dead.forEach(entry => console.error(`  ${entry}`));
    console.error('\nUpdate the path, or delete the reference.');
    process.exit(1);
  }

  console.log(`All ${checked} doc paths resolve.`);
}

await main();
