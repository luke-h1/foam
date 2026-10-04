/**
 * Every backticked source path in docs/, AGENTS.md and DESIGN.md must resolve
 * to a real file or folder, and so must every literal path in
 * doctor.config.json.
 *
 * The glossary and the ADRs are the map an agent reads before touching code.
 * A kebab-case rename pass once left 26 of CONTEXT.md's 40 pointers dead, all
 * of them silently, because nothing checked them.
 */
import { existsSync, readdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Only the docs that work as a live map of the code. The dated audit and plan
 * documents describe the codebase as it stood on their date, so a path that no
 * longer resolves is a correct historical record, not a broken pointer.
 */
const MAPPED_DOCS = [
  '.agents/skills/foam-run-ios/SKILL.md',
  'AGENTS.md',
  'DESIGN.md',
  'docs/CONTEXT.md',
  'docs/adr',
  'docs/native-patches.md',
  'docs/react-doctor.md',
];

// Paths named as prose about code that no longer exists, not as pointers.
const DELETED_ON_PURPOSE = new Set(['emoteResolutionDivergence.test.ts']);

const PATH_PATTERN = /`([A-Za-z0-9_.@%/-]+)`/g;

// docs/ writes a path relative to one of these.
const ROOTS = ['', 'src/', 'scripts/', 'scripts/workflows/'];

// An import specifier such as `store/chat/actions/messages` leaves off the extension.
const SUFFIXES = ['', '.ts', '.tsx'];

/**
 * A backticked token whose first segment is a real folder is a path. Lint rule
 * names (`react-hooks-js/purity`), package names and illustrative shapes
 * (`util/room-state/`) start with something else, so they are skipped.
 */
const PATH_HEADS = new Set(
  ROOTS.flatMap(root =>
    readdirSync(root || '.', { withFileTypes: true })
      .filter(entry => entry.isDirectory() && entry.name !== 'node_modules')
      .map(entry => entry.name),
  ),
);

function isPath(candidate: string): boolean {
  if (!candidate.includes('/') || candidate.includes('..')) {
    return false;
  }

  if (/\.tsx?$/.test(candidate)) {
    return true;
  }

  return PATH_HEADS.has(candidate.split('/')[0] ?? '');
}

function resolves(path: string): boolean {
  return ROOTS.some(root =>
    SUFFIXES.some(suffix => existsSync(`${root}${path}${suffix}`)),
  );
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

interface DoctorConfig {
  ignore?: {
    files?: string[];
    overrides?: { files: string[] }[];
  };
}

/**
 * A React Doctor override names files by path, and a path that no longer
 * exists matches nothing. The seven-tv rename left the `use-seven-tv-ws.ts`
 * exemption pointing at the old name, and the rules it silenced came back as
 * PR comments with no error to say why.
 */
async function deadDoctorConfigPaths(): Promise<string[]> {
  // SAFETY: doctor.config.json is checked in and validated by its $schema.
  const config = JSON.parse(
    await readFile('doctor.config.json', 'utf8'),
  ) as DoctorConfig;

  const paths = [
    ...(config.ignore?.files ?? []),
    ...(config.ignore?.overrides ?? []).flatMap(override => override.files),
  ];

  return paths
    .filter(path => !path.includes('*') && !existsSync(path))
    .map(path => `doctor.config.json: ${path}`);
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

      const path = candidate.replace(/^@app\//, 'src/');

      // A bare `foo.ts` in prose is a name, not a pointer.
      if (!isPath(path)) {
        continue;
      }

      checked += 1;

      if (!resolves(path)) {
        dead.push(`${file}: ${candidate}`);
      }
    }
  }

  dead.push(...(await deadDoctorConfigPaths()));

  if (dead.length > 0) {
    console.error(`${dead.length} dead path(s):\n`);
    dead.forEach(entry => console.error(`  ${entry}`));
    console.error('\nUpdate the path, or delete the reference.');
    process.exit(1);
  }

  console.log(`All ${checked} doc paths resolve.`);
}

await main();
