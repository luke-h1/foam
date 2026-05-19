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

export function buildCurrentTable(entries: ReassureEntry[]): string {
  if (entries.length === 0) {
    return 'No Reassure measurements were written.';
  }

  const rows = entries
    .map(entry => {
      const runVariation = entry.stdevDuration ?? 0;
      const count = entry.meanCount ?? 1;
      return `| ${entry.name} | ${formatMs(entry.meanDuration)} | ${formatMs(runVariation)} | ${count.toFixed(2)} |`;
    })
    .join('\n');

  return [
    '| Scenario | Mean | Typical time swing | Count |',
    '|---|---:|---:|---:|',
    rows,
  ].join('\n');
}

type HighlightKind = 'danger' | 'success' | 'warning';

function buildDiffLine(kind: HighlightKind, text: string): string {
  const prefixByKind: Record<HighlightKind, string> = {
    danger: '-',
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
  entries,
  report,
  runUrl,
  status,
}: {
  entries: ReassureEntry[];
  report: string;
  runUrl: string;
  status: string;
}): string {
  const statusLabel = status === 'success' ? 'passed' : 'failed';
  const currentTable = buildCurrentTable(entries);
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
  currentPath,
  outputPath,
  reportPath,
  runUrl,
  status,
}: {
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
  const body = buildChatPerformanceComment({
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
