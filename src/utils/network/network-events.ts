import EventEmitter from 'eventemitter3';

type UnlistenFn = () => void;
type NetworkEventName =
  | 'soft-reset'
  | 'session-dropped'
  | 'network-confirmed'
  | 'network-lost';

const emitter = new EventEmitter();

function emitNetworkEvent(eventName: NetworkEventName): void {
  emitter.emit(eventName);
}

function listenNetworkEvent(
  eventName: NetworkEventName,
  fn: () => void,
): UnlistenFn {
  emitter.on(eventName, fn);
  return () => emitter.off(eventName, fn);
}

export function emitSoftReset() {
  emitNetworkEvent('soft-reset');
}

export function listenSoftReset(fn: () => void): UnlistenFn {
  return listenNetworkEvent('soft-reset', fn);
}

export function emitSessionDropped() {
  emitNetworkEvent('session-dropped');
}

export function listenSessionDropped(fn: () => void): UnlistenFn {
  return listenNetworkEvent('session-dropped', fn);
}

export function emitNetworkConfirmed() {
  emitNetworkEvent('network-confirmed');
}

export function listenNetworkConfirmed(fn: () => void): UnlistenFn {
  return listenNetworkEvent('network-confirmed', fn);
}

export function emitNetworkLost() {
  emitNetworkEvent('network-lost');
}

export function listenNetworkLost(fn: () => void): UnlistenFn {
  return listenNetworkEvent('network-lost', fn);
}
