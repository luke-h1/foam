import { observable } from '@legendapp/state';

// Display-only mirror for the latency pill, so only the badge re-renders - never the chat list.
export const videoLatencyDisplay$ = observable<number | null>(null);
