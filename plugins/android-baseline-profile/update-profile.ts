import fs from 'node:fs';
import path from 'node:path';

const ROOT = import.meta.dirname;
const OUTPUT = path.join(ROOT, 'profiles/baseline-prof.txt');

const RECORDED = path.join(
  ROOT,
  'benchmark/build/outputs/connected_android_test_additional_output',
);

// Optional HSP flags (consumed, not kept), then a class descriptor, then an optional member
const RULE = /^(?:[HSP]*)(L[^;]+;)(.*)$/;

function findRecordedProfiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return findRecordedProfiles(entryPath);
    }

    const isRecordedProfile =
      entry.name.startsWith('BaselineProfileGenerator_') &&
      entry.name.endsWith('-baseline-prof.txt');

    return isRecordedProfile ? [entryPath] : [];
  });
}

function newestRecordedProfile(): string {
  const [newest] = findRecordedProfiles(RECORDED).toSorted(
    (a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs,
  );

  if (!newest) {
    throw new Error(
      `No recorded profile under ${RECORDED}. Run bun run android:baseline-profile first.`,
    );
  }

  return newest;
}

const inputs = process.argv.slice(2);
const recorded = inputs.length > 0 ? inputs : [newestRecordedProfile()];
const rules = new Map<string, [descriptor: string, member: string]>();

for (const file of recorded) {
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = RULE.exec(line.trim());

    if (!match) {
      continue;
    }

    const [, descriptor = '', member = ''] = match;

    // Android 14 and older only compile methods marked hot at install, and ART marks few recorded methods hot
    const rule = member === '' ? descriptor : `HSP${descriptor}${member}`;
    rules.set(rule, [descriptor, member]);
  }
}

const hasReactActivity = [...rules.keys()].some(rule =>
  rule.startsWith('HSPLcom/facebook/react/ReactActivity;'),
);

if (!hasReactActivity) {
  throw new Error(
    `${recorded.join(', ')} has no ReactActivity rules. R8 renames classes, so record from a build with -Pfoam.benchmark.minify=false.`,
  );
}

function compare(a: string, b: string): number {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
}

const sorted = [...rules]
  .toSorted(
    ([, [classA, memberA]], [, [classB, memberB]]) =>
      compare(classA, classB) || compare(memberA, memberB),
  )
  .map(([rule]) => rule);

fs.writeFileSync(OUTPUT, `${sorted.join('\n')}\n`);

const methods = sorted.filter(rule => rule.includes('->')).length;

console.log(
  `Wrote ${sorted.length} rules (${sorted.length - methods} classes, ${methods} methods) to ${path.relative(process.cwd(), OUTPUT)}`,
);
