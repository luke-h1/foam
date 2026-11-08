import { appendWithSpace } from '../appendWithSpace';

describe('appendWithSpace', () => {
  test('replaces empty text', () => {
    expect(appendWithSpace('', 'KEKW')).toEqual('KEKW ');
  });

  test('replaces whitespace-only text', () => {
    expect(appendWithSpace('   ', '@luke')).toEqual('@luke ');
  });

  test('adds one space after text that has no trailing space', () => {
    expect(appendWithSpace('hello', 'KEKW')).toEqual('hello KEKW ');
  });

  test('does not add a second space after a trailing space', () => {
    expect(appendWithSpace('hello ', 'KEKW')).toEqual('hello KEKW ');
  });
});
