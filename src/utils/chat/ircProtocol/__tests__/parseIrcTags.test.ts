import { parseIrcTags } from '../parseIrcTags';

describe('parseIrcTags', () => {
  test('returns an empty map for an empty string', () => {
    expect(parseIrcTags('')).toEqual({});
  });

  test('parses key/value pairs', () => {
    expect(parseIrcTags('display-name=Foo;color=#FF0000')).toEqual({
      'display-name': 'Foo',
      color: '#FF0000',
    });
  });

  test('keeps empty values', () => {
    expect(parseIrcTags('badge-info=;mod=0')).toEqual({
      'badge-info': '',
      mod: '0',
    });
  });

  test('preserves "=" inside a value', () => {
    expect(parseIrcTags('emotes=25:0-4=5')).toEqual({ emotes: '25:0-4=5' });
  });

  test('unescapes IRCv3 escape sequences in values', () => {
    expect(
      parseIrcTags(
        'system-msg=ModUser\\sis\\scelebrating\\s24\\smonths\\sas\\sa\\smoderator!;msg-param-reward-title=Say\\shi\\s:)',
      ),
    ).toEqual({
      'system-msg': 'ModUser is celebrating 24 months as a moderator!',
      'msg-param-reward-title': 'Say hi :)',
    });
  });

  test('does not double-decode a literal backslash', () => {
    // Raw `\\s` is an escaped backslash followed by a literal `s`, i.e. `\s`
    // as text - not a space. A second decode pass would corrupt it to a space.
    expect(parseIrcTags('ban-reason=path\\\\sfoo')).toEqual({
      'ban-reason': 'path\\sfoo',
    });
  });

  test('leaves the structural colons in the emotes tag untouched', () => {
    expect(parseIrcTags('emotes=25:0-4,6-10/1902:12-16')).toEqual({
      emotes: '25:0-4,6-10/1902:12-16',
    });
  });
});
