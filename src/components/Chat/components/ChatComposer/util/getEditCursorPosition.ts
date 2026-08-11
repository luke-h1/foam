/**
 * Where the caret lands after an edit turns `previous` into `next`, derived
 * from the text alone: the end of the run that changed.
 *
 * The composer resolves the word under the caret to decide which suggestion
 * rail to show. Native selection events are the authority on where the caret
 * is, but they are not guaranteed - the SwiftUI text field only reports a
 * selection on iOS 18+ - so the caret is recovered from the edit as well.
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
