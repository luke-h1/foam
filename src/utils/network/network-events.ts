import EventEmitter from 'eventemitter3';

type UnlistenFn = () => void;

const emitter = new EventEmitter();

// a "soft reset" typically means scrolling to top and loading latest
// but it can depend on the screen
export function emitSoftReset() {
  emitter.emit('soft-reset');
}

export function listenSoftReset(fn: () => void): UnlistenFn {
  emitter.on('soft-reset', fn);
  return () => emitter.off('soft-reset', fn);
}

export function emitSessionDropped() {
  emitter.emit('session-dropped');
}

export function listenSessionDropped(fn: () => void): UnlistenFn {
  emitter.on('session-dropped', fn);
  return () => emitter.off('session-dropped', fn);
}

export function emitNetworkConfirmed() {
  emitter.emit('network-confirmed');
}

export function listenNetworkConfirmed(fn: () => void): UnlistenFn {
  emitter.on('network-confirmed', fn);
  return () => emitter.off('network-confirmed', fn);
}

export function emitNetworkLost() {
  emitter.emit('network-lost');
}

export function listenNetworkLost(fn: () => void): UnlistenFn {
  emitter.on('network-lost', fn);
  return () => emitter.off('network-lost', fn);
}
