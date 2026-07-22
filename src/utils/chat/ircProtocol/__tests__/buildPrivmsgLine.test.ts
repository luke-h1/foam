import { buildPrivmsgLine } from '../buildPrivmsgLine';
import type { IrcMessage } from '../parseIrcMessage';
import { parseIrcMessage } from '../parseIrcMessage';

describe('buildPrivmsgLine', () => {
  test('builds a plain message line', () => {
    expect(buildPrivmsgLine({ channel: '#bar', message: 'hello world' })).toBe(
      'PRIVMSG #bar :hello world',
    );
  });

  test('attaches only the reply parent id tag on replies', () => {
    expect(
      buildPrivmsgLine({
        channel: '#bar',
        message: 'hi back',
        replyParentMsgId: 'abc-123',
      }),
    ).toBe('@reply-parent-msg-id=abc-123 PRIVMSG #bar :hi back');
  });

  test('collapses embedded newlines so the body cannot inject a second IRC line', () => {
    expect(
      buildPrivmsgLine({
        channel: '#bar',
        message: 'hello\r\nJOIN #other\nPRIVMSG #other :pwn',
      }),
    ).toBe('PRIVMSG #bar :hello JOIN #other PRIVMSG #other :pwn');
  });

  test('escapes the reply parent id so it cannot break out of the tag section', () => {
    expect(
      buildPrivmsgLine({
        channel: '#bar',
        message: 'hi back',
        replyParentMsgId: 'abc 123;evil=1\\',
      }),
    ).toBe('@reply-parent-msg-id=abc\\s123\\:evil=1\\\\ PRIVMSG #bar :hi back');
  });

  test('escaped reply parent ids survive a round-trip through the parser', () => {
    const line = buildPrivmsgLine({
      channel: '#bar',
      message: 'hi back',
      replyParentMsgId: 'abc 123;evil=1\\',
    });
    expect(parseIrcMessage(line)?.tags).toEqual({
      'reply-parent-msg-id': 'abc 123;evil=1\\',
    });
  });

  test('reply lines survive a round-trip through the parser', () => {
    /**
     * Regression: the display-name/body reply tags used to be sent raw, so a
     * multi-word parent body terminated the tag section at its first space and
     * the server read the rest of the body as the command.
     */
    const line = buildPrivmsgLine({
      channel: '#bar',
      message: 'hi back',
      replyParentMsgId: 'abc-123',
    });
    expect(parseIrcMessage(line)).toEqual<IrcMessage>({
      tags: { 'reply-parent-msg-id': 'abc-123' },
      prefix: undefined,
      command: 'PRIVMSG',
      params: ['#bar', 'hi back'],
    });
  });
});
