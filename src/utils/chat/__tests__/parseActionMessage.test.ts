import { parseActionCommand, parseActionMessage } from '../parseActionMessage';

const ctcp = (text: string) =>
  `${String.fromCharCode(1)}ACTION ${text}${String.fromCharCode(1)}`;

describe('parseActionMessage', () => {
  it('strips the CTCP ACTION wrapper and flags the message', () => {
    expect(parseActionMessage(ctcp('waves at chat'))).toEqual({
      isAction: true,
      text: 'waves at chat',
    });
  });

  it('handles an empty action body', () => {
    expect(parseActionMessage(ctcp(''))).toEqual({
      isAction: true,
      text: '',
    });
  });

  it('leaves a normal message untouched', () => {
    expect(parseActionMessage('hello world')).toEqual({
      isAction: false,
      text: 'hello world',
    });
  });

  it('does not treat an unterminated wrapper as an action', () => {
    const unterminated = `${String.fromCharCode(1)}ACTION waves`;
    expect(parseActionMessage(unterminated)).toEqual({
      isAction: false,
      text: unterminated,
    });
  });
});

describe('parseActionCommand', () => {
  it('strips a leading /me command', () => {
    expect(parseActionCommand('/me waves at chat')).toEqual({
      isAction: true,
      text: 'waves at chat',
    });
  });

  it('is case-insensitive and tolerates extra whitespace', () => {
    expect(parseActionCommand('/ME   dances')).toEqual({
      isAction: true,
      text: 'dances',
    });
  });

  it('leaves other slash commands and plain text untouched', () => {
    expect(parseActionCommand('/ban someone')).toEqual({
      isAction: false,
      text: '/ban someone',
    });
    expect(parseActionCommand('hello world')).toEqual({
      isAction: false,
      text: 'hello world',
    });
  });
});
