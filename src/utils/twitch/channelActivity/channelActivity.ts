import type { PaginatedList } from '@app/types/twitch/api';
import type { EventSubEvent } from '@app/types/twitch/eventsub';

export interface ChannelActivityEvent<TState> {
  type: string;
  normalise: (event: EventSubEvent) => TState;
}

/**
 * Describes one broadcaster-driven channel activity (a poll or a prediction):
 * how to fetch its current Helix state, how to normalise it, when it counts as
 * active, which log fields a failed fetch reports, and which EventSub event
 * types keep it live. Pure data plus pure functions - `useChannelActivity`
 * drives the orchestration.
 */
export interface ChannelActivity<THelix, TState> {
  fetch: (broadcasterId: string) => Promise<PaginatedList<THelix>>;
  normaliseHelix: (item: THelix) => TState;
  isActive: (value: TState) => boolean;
  fetchFailure: {
    message: string;
    name: string;
    action: string;
  };
  events: readonly ChannelActivityEvent<TState>[];
}
