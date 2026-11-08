import * as Application from 'expo-application';

import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';
import { isUpdateRequired } from '@app/utils/version/compareVersions';
import { getAppVariant } from '@app/utils/version/getAppVariant';
import { getMinimumVersion } from '@app/utils/version/getMinimumVersion';

export function useUpdateRequirement() {
  const { config: remoteConfig } = useRemoteConfig();

  const minimumVersion = getMinimumVersion(getAppVariant(), remoteConfig);
  const currentVersion = Application.nativeApplicationVersion ?? 'Unknown';

  const updateRequired =
    minimumVersion && currentVersion && currentVersion !== 'Unknown'
      ? isUpdateRequired(currentVersion, minimumVersion)
      : false;

  return { updateRequired, currentVersion, minimumVersion };
}
