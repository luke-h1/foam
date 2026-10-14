import {
  diffNativeChatRows,
  type NativeChatRowsDiff,
} from '../util/diff-native-chat-rows';

interface Row {
  key: string;
}

const getKey = (row: Row) => row.key;

function rows(...keys: string[]): Row[] {
  return keys.map(key => ({ key }));
}

describe('diffNativeChatRows', () => {
  test('resets when nothing was sent yet', () => {
    expect(diffNativeChatRows([], rows('a'), getKey)).toEqual<
      NativeChatRowsDiff<Row>
    >({ kind: 'reset' });
  });

  test('resets when the next window is empty', () => {
    expect(diffNativeChatRows(rows('a'), [], getKey)).toEqual<
      NativeChatRowsDiff<Row>
    >({ kind: 'reset' });
  });

  test('sends only the appended rows when the window grows', () => {
    const previous = rows('a', 'b');
    const next = [...previous, ...rows('c', 'd')];

    expect(diffNativeChatRows(previous, next, getKey)).toEqual<
      NativeChatRowsDiff<Row>
    >({
      kind: 'incremental',
      removeFromStart: 0,
      appended: next.slice(2),
    });
  });

  test('trims from the top and appends at the bottom in one batch', () => {
    const previous = rows('a', 'b', 'c');
    const next = [...previous.slice(2), ...rows('d')];

    expect(diffNativeChatRows(previous, next, getKey)).toEqual<
      NativeChatRowsDiff<Row>
    >({
      kind: 'incremental',
      removeFromStart: 2,
      appended: next.slice(1),
    });
  });

  test('resets when the first next row is not in the previous window', () => {
    expect(diffNativeChatRows(rows('a', 'b'), rows('x', 'y'), getKey)).toEqual<
      NativeChatRowsDiff<Row>
    >({ kind: 'reset' });
  });

  test('resets when a filter removes a row from the middle', () => {
    expect(
      diffNativeChatRows(rows('a', 'b', 'c'), rows('a', 'c'), getKey),
    ).toEqual<NativeChatRowsDiff<Row>>({ kind: 'reset' });
  });

  test('resets when the next window is shorter than the overlap', () => {
    expect(diffNativeChatRows(rows('a', 'b', 'c'), rows('a'), getKey)).toEqual<
      NativeChatRowsDiff<Row>
    >({ kind: 'reset' });
  });
});
