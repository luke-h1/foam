import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildStreamPlayerInjectedJavaScript,
  buildTwitchAuthHelperScript,
} from '../util/twitch-player-source/buildStreamPlayerInjectedJavaScript';
import { buildTwitchPipBridgeScript } from '../util/twitch-player-source/buildTwitchPipBridgeScript';

function getPlayerMessageTypes(): string[] {
  const types = readFileSync(join(__dirname, '../types.ts'), 'utf8');
  const start = types.indexOf('export type PlayerMessage =');
  const end = types.indexOf(';\n\n', start);
  const union = types.slice(start, end === -1 ? undefined : end);

  return [
    ...new Set(
      [...union.matchAll(/type: '([A-Za-z]+)'/g)].map(match => match[1] ?? ''),
    ),
  ].sort();
}

function getPostedMessageTypes(scripts: string[]): string[] {
  const source = scripts.join('\n');

  const posted = [
    ...source.matchAll(/\bpost\(\s*'([A-Za-z]+)'/g),
    ...source.matchAll(/\btype:\s*'([A-Za-z]+)'/g),
  ].map(match => match[1] ?? '');

  return [...new Set(posted)].sort();
}

describe('player bridge protocol', () => {
  test('the PlayerMessage union matches the message types the injected scripts post', () => {
    const injectedScripts = [
      buildTwitchAuthHelperScript(),
      buildStreamPlayerInjectedJavaScript({
        autoplay: true,
        clip: undefined,
        initialMuted: true,
        showOverlayControls: true,
        video: undefined,
      }),
      buildStreamPlayerInjectedJavaScript({
        autoplay: true,
        clip: undefined,
        initialMuted: true,
        showOverlayControls: true,
        video: '123456',
      }),
      buildTwitchPipBridgeScript(),
    ];

    const postedTypes = getPostedMessageTypes(injectedScripts);

    expect(postedTypes.length).toBeGreaterThan(0);

    expect(getPlayerMessageTypes()).toEqual(postedTypes);
  });
});
