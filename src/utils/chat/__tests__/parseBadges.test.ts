import { parseBadges } from '../parseBadges';

describe('parseBadges', () => {
  test('parses a comma-separated badge string into name/version pairs', () => {
    expect(parseBadges('moderator/1,subscriber/12,bits/1000')).toEqual({
      'badges-raw': 'moderator/1,subscriber/12,bits/1000',
      badges: { moderator: '1', subscriber: '12', bits: '1000' },
    });
  });

  test('parses a single badge', () => {
    expect(parseBadges('moderator/1')).toEqual({
      'badges-raw': 'moderator/1',
      badges: { moderator: '1' },
    });
  });

  test('returns empty raw and badges for undefined input', () => {
    expect(parseBadges()).toEqual({
      'badges-raw': '',
      badges: {},
    });
  });

  test('returns empty raw and badges for an empty string', () => {
    expect(parseBadges('')).toEqual({
      'badges-raw': '',
      badges: {},
    });
  });

  test('keeps a zero version because it is a non-empty string', () => {
    expect(parseBadges('subscriber/0')).toEqual({
      'badges-raw': 'subscriber/0',
      badges: { subscriber: '0' },
    });
  });

  test('skips a segment missing its version', () => {
    expect(parseBadges('subscriber/')).toEqual({
      'badges-raw': 'subscriber/',
      badges: {},
    });
  });

  test('skips a segment missing its name', () => {
    expect(parseBadges('/3')).toEqual({
      'badges-raw': '/3',
      badges: {},
    });
  });

  test('skips a segment with no slash at all', () => {
    expect(parseBadges('moderator')).toEqual({
      'badges-raw': 'moderator',
      badges: {},
    });
  });

  test('ignores empty segments from a trailing or doubled comma', () => {
    expect(parseBadges('moderator/1,,subscriber/2')).toEqual({
      'badges-raw': 'moderator/1,,subscriber/2',
      badges: { moderator: '1', subscriber: '2' },
    });
  });

  test('keeps only the first version when a segment has extra slashes', () => {
    expect(parseBadges('moderator/1/extra')).toEqual({
      'badges-raw': 'moderator/1/extra',
      badges: { moderator: '1' },
    });
  });
});
