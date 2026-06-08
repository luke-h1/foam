import {
  buildTimeoutCommand,
  buildTimeoutCommandDraft,
  formatTimeoutDuration,
  normalizeTimeoutCommand,
  parseTimeoutDuration,
} from '../timeoutDuration';

describe('timeoutDuration', () => {
  describe('parseTimeoutDuration', () => {
    test('parses minute durations', () => {
      expect(parseTimeoutDuration('1m')).toEqual({ ok: true, seconds: 60 });
      expect(parseTimeoutDuration('10m')).toEqual({ ok: true, seconds: 600 });
      expect(parseTimeoutDuration('1 minute')).toEqual({
        ok: true,
        seconds: 60,
      });
    });

    test('parses hour and day durations', () => {
      expect(parseTimeoutDuration('1h')).toEqual({ ok: true, seconds: 3600 });
      expect(parseTimeoutDuration('2 hours')).toEqual({
        ok: true,
        seconds: 7200,
      });
      expect(parseTimeoutDuration('1day')).toEqual({
        ok: true,
        seconds: 86400,
      });
      expect(parseTimeoutDuration('1 day')).toEqual({
        ok: true,
        seconds: 86400,
      });
    });

    test('parses raw second values', () => {
      expect(parseTimeoutDuration('90')).toEqual({ ok: true, seconds: 90 });
    });

    test('rejects empty and invalid input', () => {
      expect(parseTimeoutDuration('')).toEqual({
        ok: false,
        error: 'Enter a duration',
      });
      expect(parseTimeoutDuration('ten minutes')).toEqual({
        ok: false,
        error: 'Use formats like 1m, 10m, 1h, or 1day',
      });
      expect(parseTimeoutDuration('1w')).toEqual({
        ok: false,
        error: 'Unknown duration unit',
      });
    });

    test('rejects durations outside Twitch limits', () => {
      expect(parseTimeoutDuration('0m')).toEqual({
        ok: false,
        error: 'Duration must be at least 1 second',
      });
      expect(parseTimeoutDuration('15day')).toEqual({
        ok: false,
        error: 'Duration cannot exceed 14 days',
      });
    });
  });

  describe('formatTimeoutDuration', () => {
    test('formats common durations for display', () => {
      expect(formatTimeoutDuration(60)).toBe('1 minute');
      expect(formatTimeoutDuration(600)).toBe('10 minutes');
      expect(formatTimeoutDuration(3600)).toBe('1 hour');
      expect(formatTimeoutDuration(86400)).toBe('1 day');
      expect(formatTimeoutDuration(90)).toBe('90 seconds');
    });
  });

  describe('buildTimeoutCommand', () => {
    test('builds the Twitch timeout command', () => {
      expect(buildTimeoutCommand('viewer', 600)).toBe('/timeout viewer 600');
    });
  });

  describe('buildTimeoutCommandDraft', () => {
    test('prefills the composer with a timeout command', () => {
      expect(buildTimeoutCommandDraft('viewer')).toBe('/timeout viewer ');
    });
  });

  describe('normalizeTimeoutCommand', () => {
    test('normalizes human-readable timeout commands to seconds', () => {
      expect(normalizeTimeoutCommand('/timeout viewer 10m')).toEqual({
        ok: true,
        command: '/timeout viewer 600',
      });
      expect(normalizeTimeoutCommand('/timeout viewer 1h spam')).toEqual({
        ok: true,
        command: '/timeout viewer 3600 spam',
      });
    });

    test('returns null for non-timeout commands', () => {
      expect(normalizeTimeoutCommand('/ban viewer')).toBeNull();
    });

    test('rejects incomplete timeout commands', () => {
      expect(normalizeTimeoutCommand('/timeout viewer')).toEqual({
        ok: false,
        error: 'Enter a duration like 10m, 1h, or 1day',
      });
    });
  });
});
