import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';
import { isLoginInList } from '@app/utils/chat/chat-usernames/isLoginInList';
import { isDevToolsEnabled } from '@app/utils/dev-tools/isDevToolsEnabled';

export type DevToolsAccess = 'enabled' | 'denied' | 'pending';

export function useDevToolsAccess(): DevToolsAccess {
  const { ready, user } = useAuthContext();
  const { config, isLoading } = useRemoteConfig();

  if (isDevToolsEnabled) {
    return 'enabled';
  }

  if (isLoginInList(user?.login, config.admins.value)) {
    return 'enabled';
  }

  return !ready || isLoading ? 'pending' : 'denied';
}
