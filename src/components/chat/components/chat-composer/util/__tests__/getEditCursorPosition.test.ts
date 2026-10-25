import { getEditCursorPosition } from '../getEditCursorPosition';

describe('getEditCursorPosition', () => {
  test('lands after the character appended to the end', () => {
    expect(getEditCursorPosition('hey Kap', 'hey Kapp')).toBe(8);
  });

  test('lands at the start of an empty field that gained its first character', () => {
    expect(getEditCursorPosition('', 'K')).toBe(1);
  });

  test('lands where a backspace at the end left the caret', () => {
    expect(getEditCursorPosition('hey Kapp', 'hey Kap')).toBe(7);
  });

  test('lands after an insertion in the middle of the message', () => {
    expect(getEditCursorPosition('hey chat', 'hey there chat')).toBe(10);
  });

  test('lands after a deletion in the middle of the message', () => {
    expect(getEditCursorPosition('hey there chat', 'hey chat')).toBe(4);
  });

  test('lands after pasted text', () => {
    expect(getEditCursorPosition('hey ', 'hey https://foam.tv')).toBe(19);
  });
});
