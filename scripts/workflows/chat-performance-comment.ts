import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { getRequiredArg } from './github-actions';

export interface ReassureEntry {
  name: string;
  type: string;
  runs: number;
  meanDuration: number;
  stdevDuration?: number;
  meanCount?: number;
}

const redMarker = '\u{1F534}';
const greenMarker = '\u{1F7E2}';
const yellowMarker = '\u{1F7E1}';
const errorMarker = '\u{1F6D1}';
const performanceChangeThreshold = 0.05;

export function readCurrentEntries(path: string): ReassureEntry[] {
  if (!existsSync(path)) {
    return [];
  }

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line) as { metadata?: unknown } | ReassureEntry)
    .filter((entry): entry is ReassureEntry => !('metadata' in entry));
}

function formatMs(value: number): string {
  return `${value.toFixed(2)}ms`;
}

export function buildCurrentTable(
  entries: ReassureEntry[],
  report = '',
  baselineEntries: ReassureEntry[] = [],
): string {
  if (entries.length === 0) {
    return 'No Reassure measurements were written.';
  }

  const reportHighlights = buildEntryHighlights(entries, report);
  const baselineByName = new Map(
    baselineEntries.map(entry => [entry.name, entry]),
  );
  const scenarioWidth = Math.max(
    'Scenario'.length,
    ...entries.map(entry => entry.name.length),
  );
  const meanWidth = Math.max(
    'Mean'.length,
    ...entries.map(entry => formatMs(entry.meanDuration).length),
  );
  const swingWidth = Math.max(
    'Typical time swing'.length,
    ...entries.map(entry => formatMs(entry.stdevDuration ?? 0).length),
  );
  const countWidth = Math.max(
    'Count'.length,
    ...entries.map(entry => (entry.meanCount ?? 1).toFixed(2).length),
  );
  const formatRow = (
    scenario: string,
    mean: string,
    runVariation: string,
    count: string,
  ) =>
    [
      scenario.padEnd(scenarioWidth),
      mean.padStart(meanWidth),
      runVariation.padStart(swingWidth),
      count.padStart(countWidth),
    ].join('  ');
  const rows = entries
    .map(entry => {
      const runVariation = entry.stdevDuration ?? 0;
      const count = entry.meanCount ?? 1;
      const highlight =
        reportHighlights.get(entry.name) ??
        classifyAgainstBaseline(entry, baselineByName.get(entry.name)) ??
        'neutral';

      return buildDiffLine(
        highlight,
        formatRow(
          entry.name,
          formatMs(entry.meanDuration),
          formatMs(runVariation),
          count.toFixed(2),
        ),
      );
    })
    .join('\n');

  return [
    '```diff',
    buildDiffLine(
      'neutral',
      formatRow('Scenario', 'Mean', 'Typical time swing', 'Count'),
    ),
    rows,
    '```',
  ].join('\n');
}

type HighlightKind = 'danger' | 'success' | 'warning' | 'neutral';

function buildDiffLine(kind: HighlightKind, text: string): string {
  const prefixByKind: Record<HighlightKind, string> = {
    danger: '-',
    neutral: ' ',
    success: '+',
    warning: '!',
  };

  return `${prefixByKind[kind]} ${text}`;
}

function cleanHighlightText(line: string): string {
  return line.replace(/`/g, "'").replace(/\s+/g, ' ').trim();
}

function classifyReportLine(line: string): HighlightKind | null {
  if (
    line.includes(redMarker) ||
    line.includes(errorMarker) ||
    /^#{1,3}\s+Errors\b/.test(line)
  ) {
    return 'danger';
  }

  if (line.includes(greenMarker)) {
    return 'success';
  }

  if (
    line.includes(yellowMarker) ||
    /^#{1,3}\s+(Warnings|Significant Changes|Render Issues)\b/.test(line)
  ) {
    return 'warning';
  }

  return null;
}

function chooseStrongerHighlight(
  current: HighlightKind | undefined,
  next: HighlightKind,
): HighlightKind {
  const priority: Record<HighlightKind, number> = {
    danger: 3,
    success: 2,
    warning: 1,
    neutral: 0,
  };

  if (current == null || priority[next] > priority[current]) {
    return next;
  }

  return current;
}

function buildEntryHighlights(
  entries: ReassureEntry[],
  report: string,
): Map<string, HighlightKind> {
  const entryNames = entries.map(entry => entry.name);
  const highlights = new Map<string, HighlightKind>();

  for (const line of report.split(/\r?\n/)) {
    const kind = classifyReportLine(line);

    if (kind == null) {
      continue;
    }

    for (const name of entryNames) {
      if (!line.includes(name)) {
        continue;
      }

      highlights.set(name, chooseStrongerHighlight(highlights.get(name), kind));
    }
  }

  return highlights;
}

function classifyAgainstBaseline(
  entry: ReassureEntry,
  baseline: ReassureEntry | undefined,
): HighlightKind | null {
  if (baseline == null || baseline.meanDuration === 0) {
    return null;
  }

  const relativeChange =
    (entry.meanDuration - baseline.meanDuration) / baseline.meanDuration;

  if (relativeChange > performanceChangeThreshold) {
    return 'danger';
  }

  if (relativeChange < -performanceChangeThreshold) {
    return 'success';
  }

  return null;
}

export function buildHighlightedSummary({
  entries,
  report,
  status,
}: {
  entries: ReassureEntry[];
  report: string;
  status: string;
}): string {
  const lines = [
    buildDiffLine(
      status === 'success' ? 'success' : 'danger',
      `Performance job ${status === 'success' ? 'passed' : 'failed'}`,
    ),
    buildDiffLine('warning', `Reassure scenarios measured: ${entries.length}`),
  ];

  for (const line of report.split(/\r?\n/)) {
    const kind = classifyReportLine(line);

    if (kind == null) {
      continue;
    }

    lines.push(buildDiffLine(kind, cleanHighlightText(line)));
  }

  return ['```diff', ...lines, '```'].join('\n');
}

export function buildChatPerformanceComment({
  baselineEntries = [],
  entries,
  report,
  runUrl,
  status,
}: {
  entries: ReassureEntry[];
  baselineEntries?: ReassureEntry[];
  report: string;
  runUrl: string;
  status: string;
}): string {
  const statusLabel = status === 'success' ? 'passed' : 'failed';
  const currentTable = buildCurrentTable(entries, report, baselineEntries);
  const highlightedSummary = buildHighlightedSummary({
    entries,
    report,
    status,
  });

  return [
    `## Chat Performance ${statusLabel}`,
    '',
    `Ran ${entries.length} Reassure scenario${entries.length === 1 ? '' : 's'} with the PR base baseline.`,
    runUrl ? `Workflow run: ${runUrl}` : '',
    '',
    '### Highlighted result',
    '',
    highlightedSummary,
    '',
    '### Current measurements',
    '',
    currentTable,
    '',
    report
      ? [
          '<details>',
          '<summary>Reassure comparison report</summary>',
          '',
          report,
          '',
          '</details>',
        ].join('\n')
      : 'Reassure did not produce a comparison report.',
    '',
  ]
    .filter(line => line !== '')
    .join('\n');
}

export function writeChatPerformanceComment({
  baselinePath = '.reassure/baseline.perf',
  currentPath,
  outputPath,
  reportPath,
  runUrl,
  status,
}: {
  baselinePath?: string;
  currentPath: string;
  outputPath: string;
  reportPath: string;
  runUrl: string;
  status: string;
}): void {
  const entries = readCurrentEntries(currentPath);
  const report = existsSync(reportPath)
    ? readFileSync(reportPath, 'utf8').trim()
    : '';
  const baselineEntries = readCurrentEntries(baselinePath);
  const body = buildChatPerformanceComment({
    baselineEntries,
    entries,
    report,
    runUrl,
    status,
  });

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, body, 'utf8');
}

function main(): void {
  const args = process.argv.slice(2);
  writeChatPerformanceComment({
    currentPath: '.reassure/current.perf',
    outputPath: getRequiredArg(args, 'output'),
    reportPath: '.reassure/output.md',
    runUrl: getRequiredArg(args, 'run-url', ''),
    status: getRequiredArg(args, 'status', 'unknown'),
  });
}

if (process.env.NODE_ENV !== 'test') {
  main();
}
