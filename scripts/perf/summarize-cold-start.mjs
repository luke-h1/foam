// Turns the raw unified-log captures from cold-start-ios.sh into per-stage
// timings (ms since the launch command) with median and p90 across runs.
import fs from 'node:fs';
import path from 'node:path';

const csvPath = process.argv[2];
const rows = fs
  .readFileSync(csvPath, 'utf8')
  .trim()
  .split('\n')
  .slice(1)
  .map(l => {
    const [run, launchAt, logFile] = l.split(',');
    return { run: Number(run), launchAt: Number(launchAt) * 1000, logFile };
  });

// Marker name -> substring that identifies the first matching log line.
const MARKERS = [
  ['process_start', 'Insights: PROCESS_START'],
  ['js_bundle_start', 'Insights: RUN_JS_BUNDLE_START'],
  ['js_bundle_end', 'Insights: RUN_JS_BUNDLE_END'],
  ['app_startup_end', 'Insights: APP_STARTUP_END'],
  ['content_appeared', 'Insights: CONTENT_APPEARED'],
  ['did_finish_launching', '[FirebaseCore]'],
  ['window_key', 'Window became key'],
  ['expo_modules_register', "Registering module 'ExpoModulesCoreJSLogger'"],
  ['bundle_request', 'RCTMultipartDataTask] GET'],
  ['js_first_native_call', 'Creating JS object for module'],
  ['run_application', 'Running "main"'],
  ['router_effects_mounted', 'isAuthCallbackUrl'],
  ['auth_ready', 'twitch token validated'],
  ['first_screen_query', 'https://api.twitch.tv/helix/streams'],
  ['first_screen_data', 'GET /helix/streams 200'],
  ['webview_prewarm', 'WebKit:Process]'],
];

function parseTs(line) {
  const m = line.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
  if (!m) return null;
  return new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}`).getTime();
}

const perRun = rows.map(r => {
  const lines = fs.readFileSync(r.logFile, 'utf8').split('\n');
  const out = { run: r.run };
  for (const [name, needle] of MARKERS) {
    const line = lines.find(l => l.includes(needle));
    if (!line) {
      out[name] = null;
      continue;
    }
    if (line.includes('Insights:')) {
      // expo-insights logs the true epoch of the event; the log line itself is written later.
      const epoch = Number(line.match(/ at ([\d.]+)/)?.[1]);
      out[name] = Number.isFinite(epoch)
        ? Math.round(epoch * 1000 - r.launchAt)
        : null;
      continue;
    }
    const ts = parseTs(line);
    out[name] = ts === null ? null : Math.round(ts - r.launchAt);
  }
  return out;
});

const q = (arr, p) => {
  const s = arr.filter(v => v !== null).sort((a, b) => a - b);
  if (!s.length) return null;
  const idx = Math.min(s.length - 1, Math.ceil(p * s.length) - 1);
  return s[Math.max(0, idx)];
};

console.log(`\nruns=${perRun.length} (ms since launch command)`);
console.log(
  'stage'.padEnd(26),
  'median'.padStart(8),
  'p90'.padStart(8),
  'min'.padStart(8),
  'max'.padStart(8),
  ' per-run',
);
for (const [name] of MARKERS) {
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
  JSON.stringify({ markers: MARKERS, perRun }, null, 2),
);
