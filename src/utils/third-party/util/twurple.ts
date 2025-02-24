import { ApiClient } from '@twurple/api';
import { RefreshingAuthProvider, type AccessToken } from '@twurple/auth';
import * as SecureStore from 'expo-secure-store';

const authProvider = new RefreshingAuthProvider({
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
});

export const twurple = new ApiClient({ authProvider });

authProvider.onRefresh(async (_userId, newToken) => {
  SecureStore.setItemAsync('twurpleToken', JSON.stringify(newToken));
});

export const setupTwurple = async (channelId: string) => {
  if (authProvider.hasUser(channelId)) {
    // eslint-disable-next-line no-useless-return
    return;
  }

  const token = await SecureStore.getItemAsync('twurpleToken');
  authProvider.addUser(channelId, JSON.parse(token as string) as AccessToken);
};
