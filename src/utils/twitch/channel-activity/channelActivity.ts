import type { PaginatedList } from '@app/types/twitch/api';
import type { EventSubEvent } from '@app/types/twitch/eventsub';

export interface ChannelActivityEvent<TState> {
  type: string;
  normalise: (event: EventSubEvent) => TState;
}

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
