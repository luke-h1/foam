/**
 * Generates src/utils/emoji/emojiDataset.json from emojibase-data.
 *
 * emojibase-data ships ~1.1MB of JSON across data.json and three shortcode
 * maps, but the app only needs hexcode → deduped aliases. Precomputing that
 * here keeps emojibase-data out of the app bundle (it lives in
 * devDependencies) and ships a much smaller dataset.
 *
 * Run with: bun run gen:emoji
 */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

const emojiData = require('emojibase-data/en/data.json');
const githubShortcodes = require('emojibase-data/en/shortcodes/github.json');
const emojibaseShortcodes = require('emojibase-data/en/shortcodes/emojibase.json');
const emojibaseLegacyShortcodes = require('emojibase-data/en/shortcodes/emojibase-legacy.json');

const sources = [
  githubShortcodes,
  emojibaseShortcodes,
  emojibaseLegacyShortcodes,
];

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * @type {[hexcode: string, aliases: string[]][]}
 */
const entries = [];

for (const { hexcode } of emojiData) {
  const deduped = new Set();
  for (const source of sources) {
    for (const alias of toArray(source[hexcode])) {
      const trimmed = alias.trim().toLowerCase();
      if (trimmed) {
        deduped.add(trimmed);
      }
    }
  }

  if (deduped.size > 0) {
    entries.push([hexcode, Array.from(deduped)]);
  }
}

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/utils/emoji/emojiDataset.json',
);

writeFileSync(outPath, JSON.stringify(entries));

const kb = (JSON.stringify(entries).length / 1024).toFixed(0);
console.log(`Wrote ${entries.length} emoji entries (${kb}KB) to ${outPath}`);
