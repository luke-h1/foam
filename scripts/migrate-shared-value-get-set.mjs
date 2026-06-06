#!/usr/bin/env node
/**
 * migrate-shared-value-get-set.mjs
 *
 * Rewrites Reanimated SharedValue (and @expo/ui useNativeState) access from
 * `.value` to React Compiler–compatible `.get()` / `.set()`.
 *
 * Usage:
 *   node scripts/migrate-shared-value-get-set.mjs [--dry-run] <file...>
 *
 * Examples:
 *   node scripts/migrate-shared-value-get-set.mjs src/components/ImageZoomView/ImageZoomView.tsx
 *   node scripts/migrate-shared-value-get-set.mjs --dry-run src/screens/Stream/LiveStreamScreen.tsx
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY MIGRATE? (React Doctor `immutability` / React Compiler)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Reanimated shared values are mutable boxes: `const sv = useSharedValue(0)` returns
 * an object whose `.value` property can change without React knowing. The React
 * Compiler models hook results as *immutable for the duration of a render*. When
 * you write `sv.value = 1` or read `sv.value` during render, the compiler sees a
 * side effect on hook state and **opts the component out of automatic memoization**
 * (react-hooks-js/immutability → "This value cannot be modified").
 *
 * `.get()` and `.set()` are explicit accessors Reanimated added for Compiler
 * compatibility. They tell the compiler "this mutation is intentional UI-thread
 * state," so the component can stay in the memoization graph.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PERFORMANCE: WHAT YOU ACTUALLY GAIN (honest breakdown)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Indirect JS-thread wins (usually the big one in chat / lists / stream UI)
 *
 *    Without Compiler support, parent components re-render more often than
 *    necessary when shared values are touched incorrectly during render or when
 *    callbacks close over `.value` in ways the compiler cannot prove stable.
 *
 *    With `.get()` / `.set()`:
 *    - React Compiler can auto-memoize children, props, and event handlers.
 *    - Fewer cascading React commits while IRC messages, gestures, or layout
 *      animations are updating — less JS work competing with Hermes + FlashList.
 *    - In this repo, clearing ~97 `immutability` errors unblocks that optimization
 *      path for hot paths like LiveStreamScreen, ChatInputSection, ImageZoomView.
 *
 *    This is not "each .get() is faster than .value" — it is "the tree stops
 *    falling back to eager re-renders."
 *
 * 2. UI-thread / worklet behavior (largely unchanged)
 *
 *    Inside `useAnimatedStyle`, gesture worklets, and `withTiming` callbacks,
 *    `.get()` and `.set()` compile to the same shared storage as `.value`.
 *    Reanimated docs: updates still run on the UI thread; reads in worklets stay
 *    on the UI thread. You should not expect a measurable FPS gain *only* from
 *    swapping `.value` → `.get()` inside an isolated worklet.
 *
 * 3. JS-thread reads (same caveats as `.value`)
 *
 *    Reading a shared value from the React/JS thread (e.g. logging, bridging to
 *    React state) may block briefly while synchronizing with the UI thread.
 *    `.get()` does not remove that cost — avoid reading shared values on the JS
 *    thread in hot paths regardless of API style.
 *
 * 4. What this migration does NOT fix
 *
 *    - Putting shared-value reads/writes in component render (still a Rules-of-
 *      React violation for both APIs — keep them in useAnimatedStyle, gestures,
 *      useEffect, or event handlers).
 *    - Replacing manual `memo`/`useCallback` (see react-compiler-no-manual-memoization).
 *    - Layout thrashing, list virtualization, or network — those are separate.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TRANSFORM RULES (per `useSharedValue` / `useNativeState` binding)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   sv.value = expr     →  sv.set(expr)
 *   sv.value            →  sv.get()   (reads, including useAnimatedStyle bodies)
 *
 * Only identifiers declared via `useSharedValue(...)` or `useNativeState(...)` in
 * the same file are rewritten. Review diffs — do not run blindly on non-UI files.
 *
 * References:
 *   https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/#react-compiler-support
 *   https://react.dev/learn/react-compiler
 */
import fs from 'node:fs';
import path from 'node:path';

const HOOK_BINDING_RE =
  /const\s+(\w+)\s*=\s*(?:useSharedValue|useNativeState)(?:<[^>]*>)?\s*\(/g;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArgs = args.filter(arg => arg !== '--dry-run' && arg !== '--help');

if (args.includes('--help') || fileArgs.length === 0) {
  console.log(`Usage: node scripts/migrate-shared-value-get-set.mjs [--dry-run] <file...>

  --dry-run   Print what would change without writing files
  --help      Show this message`);
  process.exit(fileArgs.length === 0 ? 1 : 0);
}

/**
 * @param {string} content
 */
function collectSharedValueNames(content) {
  const names = new Set();
  HOOK_BINDING_RE.lastIndex = 0;
  let match;
  while ((match = HOOK_BINDING_RE.exec(content)) !== null) {
    names.add(match[1]);
  }
  return names;
}

/**
 * @param {string} content
 */
function migrate(content) {
  const names = collectSharedValueNames(content);

  if (names.size === 0) {
    return { content, changed: false, names: [] };
  }

  let next = content;
  for (const name of names) {
    // Assignments first so `sv.value = x` does not become `sv.get() = x`.
    const assignRe = new RegExp(`\\b${name}\\.value\\s*=\\s*([^;\\n]+);`, 'g');
    next = next.replace(assignRe, `${name}.set($1);`);
    const readRe = new RegExp(`\\b${name}\\.value\\b`, 'g');
    next = next.replace(readRe, `${name}.get()`);
  }

  return { content: next, changed: next !== content, names: [...names] };
}

for (const file of fileArgs) {
  const abs = path.resolve(file);
  const before = fs.readFileSync(abs, 'utf8');
  const { content, changed, names } = migrate(before);

  if (!changed) {
    console.log(`skipped ${file} (no useSharedValue/useNativeState bindings)`);
    continue;
  }

  if (dryRun) {
    console.log(`would update ${file} (${names.join(', ')})`);
    continue;
  }

  fs.writeFileSync(abs, content);
  console.log(`updated ${file} (${names.join(', ')})`);
}
