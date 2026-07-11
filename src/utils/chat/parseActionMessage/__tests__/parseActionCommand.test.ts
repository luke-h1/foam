import { parseActionCommand } from '../parseActionCommand';
import type { ParsedActionMessage } from '../types';

describe('parseActionCommand', () => {
  test('strips a leading /me command', () => {
    expect(
      parseActionCommand('/me waves at chat'),
    ).toEqual<ParsedActionMessage>({
      isAction: true,
      text: 'waves at chat',
    });
  });

  test('is case-insensitive and tolerates extra whitespace', () => {
    expect(parseActionCommand('/ME   dances')).toEqual<ParsedActionMessage>({
      isAction: true,
      text: 'dances',
    });
  });

  test('flags a bare /me with no body as an empty action', () => {
    expect(parseActionCommand('/me')).toEqual<ParsedActionMessage>({
      isAction: true,
      text: '',
    });
  });

  test('flags a /me followed by only whitespace as an empty action', () => {
    expect(parseActionCommand('/me   ')).toEqual<ParsedActionMessage>({
      isAction: true,
      text: '',
    });
  });

  test('does not treat /men as the action command', () => {
    expect(parseActionCommand('/men do things')).toEqual<ParsedActionMessage>({
      isAction: false,
      text: '/men do things',
    });
  });

  test('leaves other slash commands and plain text untouched', () => {
    expect(parseActionCommand('/ban someone')).toEqual<ParsedActionMessage>({
      isAction: false,
      text: '/ban someone',
    });
    expect(parseActionCommand('hello world')).toEqual<ParsedActionMessage>({
      isAction: false,
      text: 'hello world',
    });
  });
});
