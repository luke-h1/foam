import { sanitiseLogValue } from '../sanitiseLogValue';

describe('sanitiseLogValue', () => {
  test('truncates long strings', () => {
    const long = 'x'.repeat(800);
    expect(sanitiseLogValue(long)).toEqual(`${'x'.repeat(500)}... [truncated]`);
  });

  test('previews long arrays instead of keeping every element', () => {
    const huge = Array.from({ length: 50000 }, (_, index) => ({ index }));
    expect(sanitiseLogValue(huge)).toEqual({
      length: 50000,
      preview: [{ index: 0 }, { index: 1 }, { index: 2 }],
    });
  });

  test('summarises homogeneous emote arrays', () => {
    const emotes = Array.from({ length: 1200 }, (_, index) => ({
      id: String(index),
      name: `emote${index}`,
      url: 'https://cdn.7tv.app/emote.webp',
      site: '7tv',
    }));
    expect(sanitiseLogValue(emotes)).toEqual('[Array(1200) 7tv emotes]');
  });

  test('caps object breadth and records how many keys were dropped', () => {
    const wide: Record<string, number> = {};
    for (let index = 0; index < 100; index += 1) {
      wide[`key${index}`] = index;
    }

    const result = sanitiseLogValue(wide);
    expect(result).toEqual({
      key0: 0,
      key1: 1,
      key2: 2,
      key3: 3,
      key4: 4,
      key5: 5,
      key6: 6,
      key7: 7,
      key8: 8,
      key9: 9,
      key10: 10,
      key11: 11,
      __truncatedKeys: 88,
    });
  });

  test('breaks circular references', () => {
    const node: Record<string, unknown> = { id: 'root' };
    node.self = node;
    expect(sanitiseLogValue(node)).toEqual({ id: 'root', self: '[Circular]' });
  });

  test('reduces an Error to name, message, and stack', () => {
    const error = new Error('boom');
    expect(sanitiseLogValue(error)).toEqual({
      name: 'Error',
      message: 'boom',
      stack: error.stack,
    });
  });
});
