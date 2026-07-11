import { badgeUrlFromHost } from '../badgeUrlFromHost';
import {
  makeSevenTvFile,
  makeSevenTvHost,
} from './__fixtures__/normalizeSevenTvCosmetics.fixture';

describe('badgeUrlFromHost', () => {
  test('returns url with 4x file when present', () => {
    const host = makeSevenTvHost('https://cdn.7tv.app/badge/badge-id', [
      makeSevenTvFile('1x', 18, 18),
      makeSevenTvFile('2x', 36, 36),
      makeSevenTvFile('4x', 72, 72),
    ]);
    expect(badgeUrlFromHost(host, 'badge-id')).toBe(
      'https://cdn.7tv.app/badge/badge-id/4x.png',
    );
  });

  test('falls back to 3x then 2x then 1x when 4x missing', () => {
    const host = makeSevenTvHost('https://cdn.7tv.app/badge/badge-id', [
      makeSevenTvFile('1x', 18, 18),
      makeSevenTvFile('2x', 36, 36),
      makeSevenTvFile('3x', 54, 54),
    ]);
    expect(badgeUrlFromHost(host, 'badge-id')).toBe(
      'https://cdn.7tv.app/badge/badge-id/3x.png',
    );
  });

  test('falls back to canonical CDN url when host has no files', () => {
    const host = makeSevenTvHost('https://cdn.7tv.app', []);
    expect(badgeUrlFromHost(host, 'badge-id')).toBe(
      'https://cdn.7tv.app/badge/badge-id/4x.webp',
    );
  });
});
