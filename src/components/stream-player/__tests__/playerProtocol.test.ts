import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '../../../..');

function readRepoFile(path: string): string {
  return readFileSync(join(REPO_ROOT, path), 'utf8');
}

function getPlayerMessageTypes(): Set<string> {
  const types = readRepoFile('src/components/stream-player/types.ts');
  const start = types.indexOf('export type PlayerMessage =');
  const end = types.indexOf(';\n\n', start);
  const union = types.slice(start, end === -1 ? undefined : end);

  return new Set(
    [...union.matchAll(/type: '([A-Za-z]+)'/g)].map(match => match[1] ?? ''),
  );
}

/**
 * The hosted player page and the app speak one string protocol. The page
 * posts with `post('<type>', ...)`; the app parses into the PlayerMessage
 * union. Nothing else ties the two copies together.
 */
describe('player bridge protocol', () => {
  test('every message type the hosted player posts is in the PlayerMessage union', () => {
    const playerScript = readRepoFile('player-website/src/scripts/player.js');

    const postedTypes = [
      ...new Set(
        [...playerScript.matchAll(/post\(\s*'([A-Za-z]+)'/g)].map(
          match => match[1] ?? '',
        ),
      ),
    ];

    const unionTypes = getPlayerMessageTypes();

    expect(postedTypes.length).toBeGreaterThan(0);

    expect(postedTypes.filter(type => !unionTypes.has(type))).toEqual([]);
  });
});
