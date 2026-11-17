import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import readChangesets from '@changesets/read';

type Changeset = Awaited<ReturnType<typeof readChangesets>>[number];
type Bump = Changeset['releases'][number]['type'];

const CHANGESET_DIR = '.changeset';
const DEFAULT_CHANGELOG = 'CHANGELOG.md';
const NO_CHANGES = 'This release has no user-facing changes.';

const BUMP_ORDER: Bump[] = ['major', 'minor', 'patch'];

const BUMP_HEADINGS: Record<Bump, string> = {
  major: 'Breaking changes',
  minor: 'New',
  patch: 'Fixed',
  none: '',
};

type Notes = Map<Bump, string[]>;

function flag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function requiredFlag(args: string[], name: string): string {
  const value = flag(args, name);
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function collectNotes(changesets: Changeset[]): Notes {
  const notes: Notes = new Map();
  for (const changeset of changesets) {
    const summary = changeset.summary.trim();
    if (!summary) {
      continue;
    }
    for (const release of changeset.releases) {
      if (release.type === 'none') {
        continue;
      }
      const list = notes.get(release.type) ?? [];
      list.push(summary);
      notes.set(release.type, list);
    }
  }
  return notes;
}

function bullet(summary: string): string {
  const [first, ...rest] = summary.split('\n');
  return [`- ${first}`, ...rest.map(line => (line ? `  ${line}` : ''))].join(
    '\n',
  );
}

function renderNotes(notes: Notes, level: number): string {
  const heading = '#'.repeat(level);
  return BUMP_ORDER.filter(bump => notes.has(bump))
    .map(bump =>
      [
        `${heading} ${BUMP_HEADINGS[bump]}`,
        '',
        ...(notes.get(bump) ?? []).map(bullet),
      ].join('\n'),
    )
    .join('\n\n');
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function sectionPattern(version: string): RegExp {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^## ${escaped}(?: - .*)?$`, 'm');
}

interface Section {
  start: number;
  end: number;
  headingEnd: number;
}

function findSection(changelog: string, version: string): Section | null {
  const match = sectionPattern(version).exec(changelog);
  if (!match) {
    return null;
  }
  const start = match.index;
  const headingEnd = start + match[0].length;
  const next = changelog.slice(headingEnd).search(/^## /m);
  const end = next === -1 ? changelog.length : headingEnd + next;
  return { start, end, headingEnd };
}

function insertSection(changelog: string, section: string): string {
  const firstSection = changelog.search(/^## /m);
  if (firstSection === -1) {
    return `${changelog.trimEnd()}\n\n${section}\n`;
  }
  return `${changelog.slice(0, firstSection)}${section}\n\n${changelog.slice(firstSection)}`;
}

function appendToSection(
  changelog: string,
  existing: Section,
  body: string,
): string {
  const current = changelog.slice(existing.start, existing.end).trimEnd();
  const merged = current.endsWith(NO_CHANGES)
    ? `${current.slice(0, -NO_CHANGES.length).trimEnd()}\n\n${body}`
    : `${current}\n\n${body}`;
  return `${changelog.slice(0, existing.start)}${merged}\n\n${changelog.slice(existing.end).trimStart()}`;
}

async function pending(args: string[]): Promise<void> {
  const notes = collectNotes(await readChangesets(process.cwd()));
  const level = Number(flag(args, '--level') ?? '3');
  const rendered = renderNotes(notes, level);
  console.log(
    rendered || 'No release notes are waiting since the last release.',
  );
}

async function release(args: string[]): Promise<void> {
  const version = requiredFlag(args, '--version');
  const date = flag(args, '--date') ?? today();
  const changelogPath = flag(args, '--changelog') ?? DEFAULT_CHANGELOG;
  const changesets = await readChangesets(process.cwd());
  const body = renderNotes(collectNotes(changesets), 3);

  const changelog = readFileSync(changelogPath, 'utf8');
  const existing = findSection(changelog, version);
  let updated: string;
  if (existing && body) {
    updated = appendToSection(changelog, existing, body);
  } else if (existing) {
    updated = changelog;
  } else {
    updated = insertSection(
      changelog,
      `## ${version} - ${date}\n\n${body || NO_CHANGES}`,
    );
  }
  writeFileSync(changelogPath, updated);

  for (const changeset of changesets) {
    rmSync(join(CHANGESET_DIR, `${changeset.id}.md`));
  }

  const section = findSection(updated, version);
  console.log(section ? updated.slice(section.start, section.end).trim() : '');
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  switch (command) {
    case 'pending':
      await pending(args);
      return;
    case 'release':
      await release(args);
      return;
    default:
      throw new Error(
        'Usage: bun scripts/release-notes.ts <pending [--level 3] | release --version <version> [--date YYYY-MM-DD] [--changelog path]>',
      );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
