import { logger } from '@app/utils/logger';

export interface IrcCredentials {
  capabilities: string;
  nickname: string;
  passToken: string;
}

interface BuildIrcCredentialsOptions {
  accessToken: string | undefined;
  anonymousNick: string;
  login: string | undefined;
  membership: boolean;
}

export function buildIrcCredentials({
  accessToken,
  anonymousNick,
  login,
  membership,
}: BuildIrcCredentialsOptions): IrcCredentials {
  const trimmedLogin = login?.trim();
  const trimmedToken = accessToken?.trim();
  const canUseAuthenticatedChat =
    Boolean(trimmedLogin) && Boolean(trimmedToken);

  const nickname =
    canUseAuthenticatedChat && trimmedLogin ? trimmedLogin : anonymousNick;

  logger.chat.info(
    canUseAuthenticatedChat
      ? 'Authenticating with Twitch IRC...'
      : `Authenticating anonymously with Twitch IRC as ${nickname}...`,
  );

  if (trimmedLogin && !canUseAuthenticatedChat) {
    logger.chat.warn(
      '[useTwitchChat] Missing auth token, falling back to anonymous IRC mode',
    );
  }

  return {
    capabilities: membership
      ? 'twitch.tv/tags twitch.tv/commands twitch.tv/membership'
      : 'twitch.tv/tags twitch.tv/commands',
    nickname,
    passToken: canUseAuthenticatedChat ? `oauth:${trimmedToken}` : 'SCHMOOPIIE',
  };
}
