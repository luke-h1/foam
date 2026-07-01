import EventEmitter from 'eventemitter3';

type UnlistenFn = () => void;
type NetworkEventName =
  'soft-reset' | 'session-dropped' | 'network-confirmed' | 'network-lost';

const emitter = new EventEmitter();

function listenNetworkEvent(
  eventName: NetworkEventName,
  fn: () => void,
): UnlistenFn {
  emitter.on(eventName, fn);
  return () => emitter.off(eventName, fn);
}

export function listenNetworkConfirmed(fn: () => void): UnlistenFn {
  return listenNetworkEvent('network-confirmed', fn);
}

export function listenNetworkLost(fn: () => void): UnlistenFn {
  return listenNetworkEvent('network-lost', fn);
}
