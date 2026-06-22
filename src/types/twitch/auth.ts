export interface DefaultTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}
