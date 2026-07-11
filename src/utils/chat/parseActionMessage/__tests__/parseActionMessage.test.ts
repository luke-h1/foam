import { parseActionMessage } from '../parseActionMessage';
import type { ParsedActionMessage } from '../types';

const ctcp = (text: string) =>
  `${String.fromCharCode(1)}ACTION ${text}${String.fromCharCode(1)}`;

describe('parseActionMessage', () => {
  test('strips the CTCP ACTION wrapper and flags the message', () => {
    expect(
      parseActionMessage(ctcp('waves at chat')),
    ).toEqual<ParsedActionMessage>({
      isAction: true,
      text: 'waves at chat',
    });
  });

  test('handles an empty action body', () => {
    expect(parseActionMessage(ctcp(''))).toEqual<ParsedActionMessage>({
      isAction: true,
      text: '',
    });
  });

  test('leaves a normal message untouched', () => {
    expect(parseActionMessage('hello world')).toEqual<ParsedActionMessage>({
      isAction: false,
      text: 'hello world',
    });
  });

  test('does not treat an unterminated wrapper as an action', () => {
    const unterminated = `${String.fromCharCode(1)}ACTION waves`;
    expect(parseActionMessage(unterminated)).toEqual<ParsedActionMessage>({
      isAction: false,
      text: unterminated,
    });
  });
});
