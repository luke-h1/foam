import { AuthRequest, ResponseType, TokenResponse } from 'expo-auth-session';
import type { WebBrowserRedirectResult } from 'expo-web-browser';

export type SuccessfulAuthSessionResult = {
  type: 'success';
  params: Record<string, string>;
  url: string;
  authentication: TokenResponse;
  errorCode: null;
};

export function createTwitchSignInAuthResult(
  accessToken: string,
): SuccessfulAuthSessionResult {
  return {
    type: 'success',
    params: {
      access_token: accessToken,
    },
    url: `foam://auth#access_token=${accessToken}`,
    authentication: new TokenResponse({
      accessToken,
      expiresIn: 3600,
      issuedAt: 0,
      tokenType: 'bearer',
    }),
    errorCode: null,
  };
}

export function createTwitchSignInAuthRequest(
  authResult: SuccessfulAuthSessionResult,
): AuthRequest {
  const request = new AuthRequest({
    clientId: 'client-id',
    redirectUri: 'foam://auth',
    responseType: ResponseType.Token,
  });

  jest.spyOn(request, 'parseReturnUrl').mockReturnValue(authResult);

  return request;
}

export function createWebBrowserAuthSuccess(
  url: string,
): WebBrowserRedirectResult {
  return {
    type: 'success',
    url,
  };
}
