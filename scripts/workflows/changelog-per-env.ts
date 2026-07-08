import { execFileSync } from 'node:child_process';

export type ChangelogEnvironment =
  'production' | 'testflight' | 'internal' | 'preview';

/**
 * Promotion ladder ordered from the most stable channel (shipped last) to the
 * freshest channel (receives builds first). A section's baseline is the next
 * more-stable channel present in the same version, so each environment lists
 * only the commits it adds on top of the channel below it. That keeps the
 * accumulated work under the most stable channel it has reached and avoids
 * repeating the same commits across every channel.
 */
const ENVIRONMENT_LADDER: ChangelogEnvironment[] = [
  'production',
  'testflight',
  'internal',
  'preview',
];

const ENVIRONMENT_LABEL: Record<ChangelogEnvironment, string> = {
  production: 'Production',
  testflight: 'TestFlight',
  internal: 'Internal',
  preview: 'Preview',
};

const RELEASE_TAG_REGEXP =
  /^v?(\d+\.\d+\.\d+)(?:-(internal|testflight|preview))?$/;

export interface ReleaseTag {
  tag: string;
  version: string;
  environment: ChangelogEnvironment;
  commit: string;
}

export interface TagCommit {
  tag: string;
  commit: string;
}

/**
 * The seam the rewrite talks to git and git-cliff through. Injected in tests so
 * the planning and splicing logic can be exercised without a real repository.
 */
export interface GitCliffContext {
  headCommit(): string;
  listReleaseTags(): ReleaseTag[];
  listAllTagCommits(): TagCommit[];
  isAncestor(ancestor: string, descendant: string): boolean;
  renderRange(
    baselineCommit: string,
    headCommit: string,
    tag: string,
    ignoreTagsPattern: string | null,
  ): string;
}

interface PlannedSection {
  tag: string;
  environment: ChangelogEnvironment;
  headCommit: string;
  baselineCommit: string | null;
  baselineDescription: string | null;
}

export interface VersionPlan {
  version: string;
  sections: PlannedSection[];
}

export function parseReleaseTag(
  tag: string,
): Omit<ReleaseTag, 'commit'> | null {
  const match = RELEASE_TAG_REGEXP.exec(tag);
  if (!match) {
    return null;
  }
  const version = match[1] as string;
  const environment = (match[2] ?? 'production') as ChangelogEnvironment;
  return { tag, version, environment };
}

export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const leftPart = left[i] ?? 0;
    const rightPart = right[i] ?? 0;
    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }
  return 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The freshest tag of a version is the one whose commit sits at the tip of the
 * others, so diffing the next version against it never double-counts commits
 * that already appeared under this version's channels.
 */
function freshestTag(
  tags: ReleaseTag[],
  isAncestor: (a: string, b: string) => boolean,
): ReleaseTag {
  let best = tags[0];
  if (!best) {
    throw new Error('freshestTag requires at least one tag');
  }
  for (let i = 1; i < tags.length; i += 1) {
    const candidate = tags[i];
    if (candidate && isAncestor(best.commit, candidate.commit)) {
      best = candidate;
    }
  }
  return best;
}

export function planPerEnvironmentSections(
  releaseTags: ReleaseTag[],
  isAncestor: (a: string, b: string) => boolean,
): VersionPlan[] {
  const byVersion = new Map<string, ReleaseTag[]>();
  for (const tag of releaseTags) {
    const list = byVersion.get(tag.version) ?? [];
    list.push(tag);
    byVersion.set(tag.version, list);
  }

  const versionsAscending = [...byVersion.keys()].sort(compareVersions);
  const plans: VersionPlan[] = [];

  for (const version of versionsAscending) {
    const tags = byVersion.get(version) ?? [];
    // Single-channel versions render correctly straight from git-cliff; only
    // versions that reached more than one channel need re-bucketing.
    if (tags.length < 2) {
      continue;
    }

    const byEnvironment = new Map<ChangelogEnvironment, ReleaseTag>();
    for (const tag of tags) {
      byEnvironment.set(tag.environment, tag);
    }
    const presentEnvironments = ENVIRONMENT_LADDER.filter(environment =>
      byEnvironment.has(environment),
    );

    const previousVersion = versionsAscending
      .filter(candidate => compareVersions(candidate, version) < 0)
      .pop();
    const previousFreshest = previousVersion
      ? freshestTag(byVersion.get(previousVersion) ?? [], isAncestor)
      : null;

    const sections = presentEnvironments.map<PlannedSection>(
      (environment, index) => {
        const head = byEnvironment.get(environment) as ReleaseTag;
        if (index === 0) {
          return {
            tag: head.tag,
            environment,
            headCommit: head.commit,
            baselineCommit: previousFreshest?.commit ?? null,
            baselineDescription: previousVersion
              ? `the ${previousVersion} release`
              : null,
          };
        }
        const baselineEnvironment = presentEnvironments[
          index - 1
        ] as ChangelogEnvironment;
        const baseline = byEnvironment.get(baselineEnvironment) as ReleaseTag;
        return {
          tag: head.tag,
          environment,
          headCommit: head.commit,
          baselineCommit: baseline.commit,
          baselineDescription: `the ${ENVIRONMENT_LABEL[baselineEnvironment]} build`,
        };
      },
    );

    plans.push({ version, sections });
  }

  return plans;
}

function intermediateTagPattern(
  baselineCommit: string,
  headCommit: string,
  allTags: TagCommit[],
  isAncestor: (a: string, b: string) => boolean,
): string | null {
  const inside = allTags.filter(
    candidate =>
      candidate.commit !== headCommit &&
      candidate.commit !== baselineCommit &&
      isAncestor(candidate.commit, headCommit) &&
      !isAncestor(candidate.commit, baselineCommit),
  );
  if (inside.length === 0) {
    return null;
  }
  const alternation = inside
    .map(candidate => escapeRegExp(candidate.tag))
    .join('|');
  return `^(${alternation})$`;
}

function placeholderBody(section: PlannedSection): string {
  const beyond = section.baselineDescription
    ? ` beyond ${section.baselineDescription}`
    : '';
  return `_No changes in this build${beyond}._`;
}

function hasChangelogContent(rendered: string): boolean {
  return rendered
    .split('\n')
    .some(line => /^\s*-\s+/.test(line) || /^###\s+/.test(line));
}

function renderSection(
  section: PlannedSection,
  context: GitCliffContext,
  allTags: TagCommit[],
): string {
  const heading = `## ${section.tag}`;
  if (!section.baselineCommit) {
    return `${heading}\n\n${placeholderBody(section)}`;
  }

  const ignoreTagsPattern = intermediateTagPattern(
    section.baselineCommit,
    section.headCommit,
    allTags,
    context.isAncestor,
  );
  const rendered = context
    .renderRange(
      section.baselineCommit,
      section.headCommit,
      section.tag,
      ignoreTagsPattern,
    )
    .trim();

  if (!hasChangelogContent(rendered)) {
    return `${heading}\n\n${placeholderBody(section)}`;
  }

  // git-cliff renders its own `## <tag>` heading; pin it to the exact tag so
  // the downstream environment-label pass always finds a match.
  const body = rendered.replace(/^##[^\n]*(\n|$)/, '').trim();
  return `${heading}\n\n${body}`;
}

function headingVersion(line: string): string | null {
  const match = /^##\s+(.+?)\s*$/.exec(line);
  if (!match) {
    return null;
  }
  const parsed = parseReleaseTag(match[1] as string);
  return parsed ? parsed.version : null;
}

function spliceVersionBlocks(
  markdown: string,
  blockByVersion: Map<string, string>,
): string {
  const lines = markdown.split('\n');
  const output: string[] = [];
  const emitted = new Set<string>();

  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (line.startsWith('## ')) {
      const version = headingVersion(line);
      if (version != null && blockByVersion.has(version)) {
        if (!emitted.has(version)) {
          output.push(...(blockByVersion.get(version) as string).split('\n'));
          output.push('');
          emitted.add(version);
        }
        index += 1;
        while (index < lines.length && !lines[index]?.startsWith('## ')) {
          index += 1;
        }
        continue;
      }
    }
    output.push(line);
    index += 1;
  }

  return output.join('\n');
}

/**
 * Re-bucket every multi-channel version in a git-cliff generated changelog so
 * each environment section reflects exactly what that build added, no section
 * silently vanishes when two channel tags share a commit, and the ordering is
 * stable across regenerations.
 */
export function rewritePerEnvironmentSections(
  markdown: string,
  context: GitCliffContext,
): string {
  const releaseTags = context.listReleaseTags();
  if (releaseTags.length === 0) {
    return markdown;
  }

  const plans = planPerEnvironmentSections(releaseTags, context.isAncestor);
  if (plans.length === 0) {
    return markdown;
  }

  const allTags = context.listAllTagCommits();
  const blockByVersion = new Map<string, string>();
  for (const plan of plans) {
    const sections = plan.sections.map(section =>
      renderSection(section, context, allTags),
    );
    blockByVersion.set(plan.version, sections.join('\n\n'));
  }

  return spliceVersionBlocks(markdown, blockByVersion);
}

export function createGitCliffContext(options: {
  gitCliffBin: string;
  configPath: string;
  currentTag?: string | null;
  cwd?: string;
}): GitCliffContext {
  const { gitCliffBin, configPath, currentTag, cwd } = options;

  const runStdout = (command: string, args: string[]): string =>
    execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

  const headCommit = (): string =>
    runStdout('git', ['rev-parse', 'HEAD']).trim();

  const ancestorCache = new Map<string, boolean>();
  const isAncestor = (ancestor: string, descendant: string): boolean => {
    if (ancestor === descendant) {
      return true;
    }
    const key = `${ancestor} ${descendant}`;
    const cached = ancestorCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    let result = false;
    try {
      execFileSync(
        'git',
        ['merge-base', '--is-ancestor', ancestor, descendant],
        { cwd, stdio: 'ignore' },
      );
      result = true;
    } catch {
      result = false;
    }
    ancestorCache.set(key, result);
    return result;
  };

  const listAllTagCommits = (): TagCommit[] => {
    const output = runStdout('git', [
      'for-each-ref',
      '--format=%(refname:short)\t%(objectname)\t%(*objectname)',
      'refs/tags',
    ]);
    const rows: TagCommit[] = [];
    for (const line of output.split('\n')) {
      if (line.trim() === '') {
        continue;
      }
      const [tag, objectName, dereferenced] = line.split('\t');
      if (tag == null || objectName == null) {
        continue;
      }
      const commit =
        dereferenced != null && dereferenced.length > 0
          ? dereferenced
          : objectName;
      rows.push({ tag, commit });
    }
    return rows;
  };

  const listReleaseTags = (): ReleaseTag[] => {
    const byTag = new Map<string, ReleaseTag>();
    for (const { tag, commit } of listAllTagCommits()) {
      const parsed = parseReleaseTag(tag);
      if (parsed) {
        byTag.set(tag, { ...parsed, commit });
      }
    }
    // The tag for the release in flight is not created until after the
    // changelog is written, so add it at HEAD to plan its sections now.
    if (currentTag) {
      const parsed = parseReleaseTag(currentTag);
      if (parsed && !byTag.has(currentTag)) {
        byTag.set(currentTag, { ...parsed, commit: headCommit() });
      }
    }
    return [...byTag.values()];
  };

  const renderRange = (
    baselineCommit: string,
    head: string,
    tag: string,
    ignoreTagsPattern: string | null,
  ): string => {
    const args = [
      '--config',
      configPath,
      `${baselineCommit}..${head}`,
      '--tag',
      tag,
      '--strip',
      'all',
    ];
    if (ignoreTagsPattern) {
      args.push('--ignore-tags', ignoreTagsPattern);
    }
    try {
      return runStdout(gitCliffBin, args);
    } catch {
      return '';
    }
  };

  return {
    headCommit,
    listReleaseTags,
    listAllTagCommits,
    isAncestor,
    renderRange,
  };
}
