/**
 * Where the caret lands after an edit: the end of the changed run. The SwiftUI
 * field only reports selection on iOS 18+, so the caret is recovered from the edit too.
 */
export const getEditCursorPosition = (
  previous: string,
  next: string,
): number => {
  const maxShared = Math.min(previous.length, next.length);

  let prefix = 0;
  while (prefix < maxShared && previous[prefix] === next[prefix]) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < maxShared - prefix &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  return next.length - suffix;
};
