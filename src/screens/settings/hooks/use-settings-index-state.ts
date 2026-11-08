import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';
import { useAppUpdate } from '@app/hooks/use-app-update';
import { useDevToolsAccess } from '@app/hooks/use-dev-tools-access';
import { isUpdateAppButtonAllowed } from '@app/utils/app-update/isUpdateAppButtonAllowed';

import {
  getSettingsMenuSections,
  getUpdateMenuRows,
} from '../util/settingsMenu';

const variant = process.env.EXPO_PUBLIC_APP_VARIANT;

export function useSettingsIndexState() {
  const { user } = useAuthContext();
  const { config } = useRemoteConfig();
  const { openStore, updateBundle } = useAppUpdate();
  const devToolsAccess = useDevToolsAccess();

  const updateRows = getUpdateMenuRows({
    canSeeUpdateAppButton: isUpdateAppButtonAllowed(
      user?.login,
      config.updateAppButtonAllowedUsers.value,
    ),
    bundleButtonEnabled: config.bundleButtonEnabled.value.ios[variant],
    openStore,
    updateBundle,
  });

  return {
    user,
    sections: getSettingsMenuSections({
      updateRows,
      shouldShowDevTools: devToolsAccess === 'enabled',
    }),
  };
}
