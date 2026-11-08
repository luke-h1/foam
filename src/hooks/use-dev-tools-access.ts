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

  // Until remote config and restored auth settle, "not an admin" is
  // indistinguishable from "not loaded yet" - hold rather than redirect so an
  // admin isn't bounced out during the initial fetch.
  return !ready || isLoading ? 'pending' : 'denied';
}
