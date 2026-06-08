const TWITCH_MAX_TIMEOUT_SECONDS = 1_209_600;

const DURATION_UNIT_SECONDS = {
  s: 1,
  sec: 1,
  secs: 1,
  second: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mins: 60,
  minute: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hour: 3600,
  hours: 3600,
  d: 86400,
  day: 86400,
  days: 86400,
} as const;

type DurationUnit = keyof typeof DURATION_UNIT_SECONDS;

export type ParseTimeoutDurationResult =
  | { ok: true; seconds: number }
  | { ok: false; error: string };

function validateTimeoutSeconds(seconds: number): ParseTimeoutDurationResult {
  if (!Number.isFinite(seconds) || seconds < 1) {
    return { ok: false, error: 'Duration must be at least 1 second' };
  }

  if (seconds > TWITCH_MAX_TIMEOUT_SECONDS) {
    return { ok: false, error: 'Duration cannot exceed 14 days' };
  }

  return { ok: true, seconds: Math.trunc(seconds) };
}

export function parseTimeoutDuration(
  input: string,
): ParseTimeoutDurationResult {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, error: 'Enter a duration' };
  }

  if (/^\d+$/.test(trimmed)) {
    return validateTimeoutSeconds(Number.parseInt(trimmed, 10));
  }

  const match = trimmed.match(/^(\d+)\s*([a-z]+)$/);
  if (!match) {
    return {
      ok: false,
      error: 'Use formats like 1m, 10m, 1h, or 1day',
    };
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2] as DurationUnit;
  const multiplier = DURATION_UNIT_SECONDS[unit];
  if (!multiplier) {
    return { ok: false, error: 'Unknown duration unit' };
  }

  return validateTimeoutSeconds(amount * multiplier);
}

export function formatTimeoutDuration(seconds: number): string {
  if (seconds % 86400 === 0 && seconds >= 86400) {
    const days = seconds / 86400;
    return days === 1 ? '1 day' : `${days} days`;
  }

  if (seconds % 3600 === 0 && seconds >= 3600) {
    const hours = seconds / 3600;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  if (seconds % 60 === 0 && seconds >= 60) {
    const minutes = seconds / 60;
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }

  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}

export function buildTimeoutCommand(login: string, seconds: number): string {
  return `/timeout ${login} ${seconds}`;
}

export function buildTimeoutCommandDraft(login: string): string {
  return `/timeout ${login} `;
}

export function isTimeoutChatCommand(input: string): boolean {
  return input.trim().toLowerCase().startsWith('/timeout');
}

export type NormalizeTimeoutCommandResult =
  | { ok: true; command: string }
  | { ok: false; error: string };

export function normalizeTimeoutCommand(
  input: string,
): NormalizeTimeoutCommandResult | null {
  const trimmed = input.trim();
  if (!isTimeoutChatCommand(trimmed)) {
    return null;
  }

  const match = trimmed.match(/^\/timeout\s+(\S+)(?:\s+(.*))?$/i);
  if (!match) {
    return {
      ok: false,
      error: 'Usage: /timeout username 10m',
    };
  }

  const login = match[1];
  const remainder = match[2]?.trim() ?? '';
  if (!remainder) {
    return {
      ok: false,
      error: 'Enter a duration like 10m, 1h, or 1day',
    };
  }

  const durationMatch = remainder.match(/^(\S+)(?:\s+(.*))?$/);
  if (!durationMatch) {
    return {
      ok: false,
      error: 'Enter a duration like 10m, 1h, or 1day',
    };
  }

  const parsed = parseTimeoutDuration(durationMatch[1]);
  if (!parsed.ok) {
    return parsed;
  }

  const reason = durationMatch[2]?.trim();
  const command = buildTimeoutCommand(login, parsed.seconds);
  return {
    ok: true,
    command: reason ? `${command} ${reason}` : command,
  };
}
