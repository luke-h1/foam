import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';

export function useAboutDetails() {
  const { config } = useRemoteConfig();

  return {
    websiteUrl: config.websiteUrl.value,
    statusPageUrl: config.statusPageUrl.value,
    version: Application.nativeApplicationVersion ?? 'Unknown',
    build: Application.nativeBuildVersion ?? 'Unknown',
    otaLabel: Updates.updateId ?? 'Embedded',
  };
}
