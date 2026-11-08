import {
  buildIrcCredentials,
  type IrcCredentials,
} from '../buildIrcCredentials';

describe('buildIrcCredentials', () => {
  test('authenticates with a trimmed login and token', () => {
    expect(
      buildIrcCredentials({
        accessToken: ' token-1 ',
        anonymousNick: 'justinfan123',
        login: ' viewer ',
        membership: false,
      }),
    ).toEqual<IrcCredentials>({
      capabilities: 'twitch.tv/tags twitch.tv/commands',
      nickname: 'viewer',
      passToken: 'oauth:token-1',
    });
  });

  test('joins anonymously when the token is missing', () => {
    expect(
      buildIrcCredentials({
        accessToken: undefined,
        anonymousNick: 'justinfan123',
        login: 'viewer',
        membership: false,
      }),
    ).toEqual<IrcCredentials>({
      capabilities: 'twitch.tv/tags twitch.tv/commands',
      nickname: 'justinfan123',
      passToken: 'SCHMOOPIIE',
    });
  });

  test('joins anonymously when the login is blank', () => {
    expect(
      buildIrcCredentials({
        accessToken: 'token-1',
        anonymousNick: 'justinfan123',
        login: '  ',
        membership: false,
      }).nickname,
    ).toEqual('justinfan123');
  });

  test('requests the membership capability when asked', () => {
    expect(
      buildIrcCredentials({
        accessToken: 'token-1',
        anonymousNick: 'justinfan123',
        login: 'viewer',
        membership: true,
      }).capabilities,
    ).toEqual('twitch.tv/tags twitch.tv/commands twitch.tv/membership');
  });
});
