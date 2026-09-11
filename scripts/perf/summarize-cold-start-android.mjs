// Per-stage timings (ms since `am start`) with median and p90 across runs,
// from the logcat captures written by cold-start-android.sh.
import fs from 'node:fs';
import path from 'node:path';

const csvPath = process.argv[2];
const lines = fs.readFileSync(csvPath, 'utf8').trim().split('\n').slice(1);
const rows = lines.map(l => {
  const m = l.match(/^(\d+),(\d+),"(.*)",(.*)$/);
  return {
    run: Number(m[1]),
    launchMs: Number(m[2]),
    amOut: m[3],
    logFile: m[4],
  };
});

const MARKERS = [
  ['activity_displayed', 'Displayed com.lhowsam'],
  ['js_bundle_start', 'Insights: RUN_JS_BUNDLE_START'],
  ['js_bundle_end', 'Insights: RUN_JS_BUNDLE_END'],
  ['app_startup_end', 'Insights: APP_STARTUP_END'],
  ['content_appeared', 'Insights: CONTENT_APPEARED'],
  ['bundle_request', 'index.bundle?platform=android'],
  ['run_application', 'Running "main"'],
  ['router_effects_mounted', 'isAuthCallbackUrl'],
  ['auth_ready', 'twitch token validated'],
  ['first_screen_query', 'https://api.twitch.tv/helix/streams'],
  ['first_screen_data', 'GET /helix/streams 200'],
];

const perRun = rows.map(r => {
  const log = fs.readFileSync(r.logFile, 'utf8').split('\n');
  const out = { run: r.run };
  const total = r.amOut.match(/TotalTime: (\d+)/);
  const wait = r.amOut.match(/WaitTime: (\d+)/);
  out.am_total_time = total ? Number(total[1]) : null;
  out.am_wait_time = wait ? Number(wait[1]) : null;
  for (const [name, needle] of MARKERS) {
    const line = log.find(l => l.includes(needle));
    if (!line) {
      out[name] = null;
      continue;
    }
    if (line.includes('Insights:')) {
      const epochMs = Number(line.match(/ at (\d+)/)?.[1]);
      out[name] = Number.isFinite(epochMs)
        ? Math.round(epochMs - r.launchMs)
        : null;
      continue;
    }
    const ts = Number(line.match(/^\s*(\d+\.\d+)/)?.[1]);
    out[name] = Number.isFinite(ts) ? Math.round(ts * 1000 - r.launchMs) : null;
  }
  return out;
});

const q = (arr, p) => {
  const s = arr.filter(v => v !== null).sort((a, b) => a - b);
  if (!s.length) return null;
  return s[Math.max(0, Math.min(s.length - 1, Math.ceil(p * s.length) - 1))];
};
const names = ['am_total_time', 'am_wait_time', ...MARKERS.map(m => m[0])];
console.log(
  `\nruns=${perRun.length} (ms since am start; am_* are reported by ActivityManager)`,
);
console.log(
  'stage'.padEnd(26),
  'median'.padStart(8),
  'p90'.padStart(8),
  'min'.padStart(8),
  'max'.padStart(8),
  ' per-run',
);
for (const name of names) {
  const vals = perRun.map(r => r[name]);
  const s = vals.filter(v => v !== null);
  console.log(
    name.padEnd(26),
    String(q(vals, 0.5)).padStart(8),
    String(q(vals, 0.9)).padStart(8),
    String(s.length ? Math.min(...s) : null).padStart(8),
    String(s.length ? Math.max(...s) : null).padStart(8),
    ' ' + vals.join(','),
  );
}
fs.writeFileSync(
  path.join(path.dirname(csvPath), 'summary.json'),
  JSON.stringify({ perRun }, null, 2),
);
