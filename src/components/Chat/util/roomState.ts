export type ParsedRoomState = {
  emoteOnly: boolean;
  followersOnlyMinutes: number;
  r9k: boolean;
  slowSeconds: number;
  subsOnly: boolean;
};

const ROOMSTATE_NOTICE_IDS = new Set([
  'emote_only_off',
  'emote_only_on',
  'followers_off',
  'followers_on',
  'followers_on_zero',
  'slow_off',
  'slow_on',
  'subs_off',
  'subs_on',
]);

export const SUPPRESSED_NOTICE_IDS = new Set([
  ...ROOMSTATE_NOTICE_IDS,
  'delete_message_success',
]);

export function parseRoomStateTags(
  tags: Record<string, string>,
): ParsedRoomState {
  const followersOnlyRaw = Number.parseInt(tags['followers-only'] ?? '-1', 10);
  const slowRaw = Number.parseInt(tags.slow ?? '0', 10);

  return {
    emoteOnly: tags.emote_only === '1',
    followersOnlyMinutes: Number.isNaN(followersOnlyRaw)
      ? -1
      : followersOnlyRaw,
    r9k: tags.r9k === '1',
    slowSeconds: Number.isNaN(slowRaw) ? 0 : slowRaw,
    subsOnly: tags['subs-only'] === '1',
  };
}

export function describeInitialRoomState(
  state: ParsedRoomState,
): string | null {
  const activeModes: string[] = [];

  if (state.emoteOnly) {
    activeModes.push('emote-only');
  }

  if (state.subsOnly) {
    activeModes.push('subscribers-only');
  }

  if (state.r9k) {
    activeModes.push('unique-chat');
  }

  if (state.slowSeconds > 0) {
    activeModes.push(`slow mode (${state.slowSeconds}s)`);
  }

  if (state.followersOnlyMinutes === 0) {
    activeModes.push('followers-only');
  }

  if (state.followersOnlyMinutes > 0) {
    activeModes.push(`followers-only (${state.followersOnlyMinutes}m)`);
  }

  if (activeModes.length === 0) {
    return null;
  }

  return `Chat modes active: ${activeModes.join(', ')}`;
}

export function describeRoomStateChanges(
  previous: ParsedRoomState,
  next: ParsedRoomState,
): string[] {
  const changes: string[] = [];

  if (previous.emoteOnly !== next.emoteOnly) {
    changes.push(
      next.emoteOnly ? 'Emote-only mode enabled' : 'Emote-only mode disabled',
    );
  }

  if (previous.subsOnly !== next.subsOnly) {
    changes.push(
      next.subsOnly
        ? 'Subscribers-only mode enabled'
        : 'Subscribers-only mode disabled',
    );
  }

  if (previous.r9k !== next.r9k) {
    changes.push(
      next.r9k ? 'Unique-chat mode enabled' : 'Unique-chat mode disabled',
    );
  }

  if (previous.slowSeconds !== next.slowSeconds) {
    changes.push(
      next.slowSeconds > 0
        ? `Slow mode enabled (${next.slowSeconds}s)`
        : 'Slow mode disabled',
    );
  }

  if (previous.followersOnlyMinutes !== next.followersOnlyMinutes) {
    if (next.followersOnlyMinutes < 0) {
      changes.push('Followers-only mode disabled');
    } else if (next.followersOnlyMinutes === 0) {
      changes.push('Followers-only mode enabled');
    } else {
      changes.push(
        `Followers-only mode enabled (${next.followersOnlyMinutes}m)`,
      );
    }
  }

  return changes;
}
