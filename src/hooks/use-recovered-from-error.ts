import { observable } from '@legendapp/state';
import { useSelector } from '@legendapp/state/react';

const recoveredFromError$ = observable<boolean>(false);

export function setRecoveredFromError(recovered: boolean): void {
  recoveredFromError$.set(recovered);
}

export function useRecoveredFromError(): boolean {
  return useSelector(recoveredFromError$);
}
