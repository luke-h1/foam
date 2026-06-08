import type { RefObject } from 'react';

export function createRef<T>(current: T): RefObject<T> {
  return { current };
}
