export function eventSubEventFromMessage(message: {
  event?: Record<string, unknown>;
  payload?: unknown;
}): Record<string, unknown> | undefined {
  if (message.event) {
    return message.event;
  }

  if (
    message.payload &&
    typeof message.payload === 'object' &&
    'event' in message.payload
  ) {
    const payloadEvent = (
      message.payload as { event?: Record<string, unknown> }
    ).event;
    return payloadEvent;
  }

  return undefined;
}
