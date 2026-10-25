import type { EventSubPayload } from '@app/types/twitch/eventsub';

export function eventSubEventFromMessage<TEvent>(message: {
  event?: TEvent;
  payload?: EventSubPayload & { event?: TEvent };
}): TEvent | undefined {
  return message.event ?? message.payload?.event;
}
