import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { getRequiredArg } from './github-actions';

interface ReassureEntry {
  name: string;
  type: string;
  runs: number;
  meanDuration: number;
  stdevDuration?: number;
  meanCount?: number;
}

function readCurrentEntries(path: string): ReassureEntry[] {
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

function buildCurrentTable(entries: ReassureEntry[]): string {
  if (entries.length === 0) {
    return 'No Reassure measurements were written.';
  }

  const rows = entries
    .map(entry => {
      const stdev = entry.stdevDuration ?? 0;
      const count = entry.meanCount ?? 1;
      return `| ${entry.name} | ${formatMs(entry.meanDuration)} | ${formatMs(stdev)} | ${count.toFixed(2)} |`;
    })
    .join('\n');

  return [
    '| Scenario | Mean | Std dev | Count |',
    '|---|---:|---:|---:|',
    rows,
  ].join('\n');
}

function main(): void {
  const args = process.argv.slice(2);
  const status = getRequiredArg(args, 'status', 'unknown');
  const outputPath = getRequiredArg(args, 'output');
  const runUrl = getRequiredArg(args, 'run-url', '');
  const reportPath = '.reassure/output.md';
  const currentPath = '.reassure/current.perf';
  const entries = readCurrentEntries(currentPath);
  const report = existsSync(reportPath)
    ? readFileSync(reportPath, 'utf8').trim()
    : '';
  const statusLabel = status === 'success' ? 'passed' : 'failed';
  const currentTable = buildCurrentTable(entries);

  const body = [
    `## Chat Performance ${statusLabel}`,
    '',
    `Ran ${entries.length} Reassure scenario${entries.length === 1 ? '' : 's'} with the PR base baseline.`,
    runUrl ? `Workflow run: ${runUrl}` : '',
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

  writeFileSync(outputPath, body, 'utf8');
}

main();
