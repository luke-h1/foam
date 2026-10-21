/**
 * Prints process CPU / PSS for the Foam package to stdout (Argent `script:`).
 *
 *   BUNDLE_ID=com.lhowsam.foam.internal node scripts/bench/print-native-metrics.mjs
 */
import { execFileSync } from 'node:child_process';

const BUNDLE_ID =
  process.env.BUNDLE_ID ??
  process.env.FOAM_BUNDLE_ID ??
  'com.lhowsam.foam.internal';

const LABEL = process.env.METRICS_LABEL ?? 'sample';

function adb(args) {
  const serial = process.env.ANDROID_SERIAL;
  const prefix = serial ? ['-s', serial] : [];
  return execFileSync('adb', [...prefix, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15_000,
  });
}

function parseMeminfoPssKb(text) {
  const totalPss = text.match(/TOTAL PSS:\s+(\d+)/i);
  if (totalPss) {
    return Number(totalPss[1]);
  }

  const total = text.match(/^\s*TOTAL\s+(\d+)/m);
  return total ? Number(total[1]) : null;
}

function parseCpuPercent(text) {
  const escaped = BUNDLE_ID.replace(/\./g, '\\.');
  const match = text.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)%\\s+\\d+/${escaped}[^\\n]*`, 'i'),
  );
  return match ? Number(match[1]) : null;
}

function tryPullSuiteJson() {
  try {
    const raw = adb([
      'shell',
      `run-as ${BUNDLE_ID} cat files/chat-perf-suite.json 2>/dev/null`,
    ]);
    if (!raw || raw.trim().length < 2) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function main() {
  let memKb = null;
  let cpuPct = null;

  try {
    const meminfo = adb(['shell', 'dumpsys', 'meminfo', BUNDLE_ID]);
    memKb = parseMeminfoPssKb(meminfo);
  } catch (error) {
    console.log(`[metrics ${LABEL}] meminfo failed: ${String(error)}`);
  }

  try {
    const cpuinfo = adb(['shell', 'dumpsys', 'cpuinfo']);
    cpuPct = parseCpuPercent(cpuinfo);
  } catch (error) {
    console.log(`[metrics ${LABEL}] cpuinfo failed: ${String(error)}`);
  }

  const memMb =
    memKb != null && Number.isFinite(memKb) ? Math.round(memKb / 1024) : null;

  const parts = [
    `[metrics ${LABEL}]`,
    `pkg ${BUNDLE_ID}`,
    memMb != null ? `pss ${memMb}MB` : 'pss -',
    cpuPct != null ? `cpu ${cpuPct}%` : 'cpu -',
  ];

  const suite = tryPullSuiteJson();
  if (suite?.phases?.length) {
    const last = suite.phases[suite.phases.length - 1];
    parts.push(
      `phases ${suite.phases.length}`,
      `last ${last.preset} ui-fps ${last.uiFpsAvg} cpu ${last.cpuAvg}% memD ${last.memDeltaMb}MB`,
    );
  } else if (suite?.samples?.length) {
    const last = suite.samples[suite.samples.length - 1];
    parts.push(`in-app cpu ${last.cpu}% mem ${last.memMb}MB`);
  }

  console.log(parts.join('  |  '));
}

main();
