import { sanitizeInput } from '../sanitizeInput';

describe('sanitizeInput', () => {
  test('returns an empty string unchanged', () => {
    expect(sanitizeInput('')).toBe('');
  });

  test('leaves text with no angle brackets unchanged', () => {
    expect(sanitizeInput('hello world')).toBe('hello world');
  });

  test('escapes a bare less-than to &lt;', () => {
    expect(sanitizeInput('<')).toBe('&lt;');
  });

  test('escapes a bare greater-than to &gt;', () => {
    expect(sanitizeInput('>')).toBe('&gt;');
  });

  test('escapes both brackets in surrounding text', () => {
    expect(sanitizeInput('a < b > c')).toBe('a &lt; b &gt; c');
  });

  test('preserves the <3 heart emote instead of escaping it', () => {
    expect(sanitizeInput('<3')).toBe('<3');
  });

  test('preserves the >( angry emote instead of escaping it', () => {
    expect(sanitizeInput('>(')).toBe('>(');
  });

  test('preserves every occurrence of a repeated heart emote', () => {
    expect(sanitizeInput('<3 <3 <3')).toBe('<3 <3 <3');
  });

  test('preserves a heart emote while still escaping an adjacent bare bracket', () => {
    expect(sanitizeInput('<3 <')).toBe('<3 &lt;');
  });

  test('preserves an angry emote while still escaping an adjacent bare bracket', () => {
    expect(sanitizeInput('>( >')).toBe('>( &gt;');
  });

  test('handles hearts, angry emotes and bare brackets together', () => {
    expect(sanitizeInput('<3 >( <>')).toBe('<3 >( &lt;&gt;');
  });
});
