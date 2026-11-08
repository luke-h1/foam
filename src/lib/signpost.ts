import Signpost from '@modules/signpost/src/SignpostModule';

export function markSignpost(name: string): void {
  Signpost.mark(name);
}

export function beginSignpost(name: string): void {
  Signpost.begin(name);
}

export function endSignpost(name: string): void {
  Signpost.end(name);
}
