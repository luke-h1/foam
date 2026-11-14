/**
 * Every backticked source path in docs/, AGENTS.md and DESIGN.md must resolve
 * to a real file or folder, and so must every literal path in
 * doctor.config.json.
 */
import { existsSync, readdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const MAPPED_DOCS = [
  '.agents/skills/foam-run-ios/SKILL.md',
  'AGENTS.md',
  'DESIGN.md',
  'docs/CONTEXT.md',
  'docs/adr',
  'docs/native-patches.md',
  'docs/react-doctor.md',
];

const DELETED_ON_PURPOSE = new Set(['emoteResolutionDivergence.test.ts']);

const PATH_PATTERN = /`([A-Za-z0-9_.@%/-]+)`/g;

const ROOTS = ['', 'src/', 'scripts/', 'scripts/workflows/'];

const SUFFIXES = ['', '.ts', '.tsx'];

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
