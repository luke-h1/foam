import { useRef } from 'react';
import { Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@app/context/AuthContext';
import { useRemoteConfig } from '@app/hooks/firebase/useRemoteConfig';
import { useAppUpdate } from '@app/hooks/useAppUpdate';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { isUpdateAppButtonAllowed } from '@app/utils/appUpdate/isUpdateAppButtonAllowed';
import {
  isAdminLogin,
  isDevToolsEnabled,
} from '@app/utils/devTools/devToolsGate';

import { SettingsIndexAndroidList } from './components/SettingsIndexAndroidList';
import { SettingsIndexIOSForm } from './components/SettingsIndexIOSForm';

const variant = process.env.EXPO_PUBLIC_APP_VARIANT;

export function SettingsIndexScreen() {
  const { user } = useAuthContext();
  const { config } = useRemoteConfig();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { openStore, updateBundle } = useAppUpdate();
  const shouldShowDevTools =
    isDevToolsEnabled || isAdminLogin(user?.login, config.admins.value);

  useScrollToTop(scrollRef);

  const {
    statusPageUrl,
    websiteUrl,
    bundleButtonEnabled: configBundleButtonEnabled,
  } = config;

  const bundleButtonEnabled = configBundleButtonEnabled.value.ios[variant];
  const canSeeUpdateAppButton = isUpdateAppButtonAllowed(
    user?.login,
    config.updateAppButtonAllowedUsers.value,
  );

  if (Platform.OS === 'ios') {
    return (
      <SettingsIndexIOSForm
        bundleButtonEnabled={bundleButtonEnabled}
        canSeeUpdateAppButton={canSeeUpdateAppButton}
        hasUser={Boolean(user)}
        openStore={openStore}
        shouldShowDevTools={shouldShowDevTools}
        statusPageUrl={statusPageUrl.value}
        updateBundle={updateBundle}
        websiteUrl={websiteUrl.value}
      />
    );
  }

  return (
    <SettingsIndexAndroidList
      bottomInset={insets.bottom}
      canSeeUpdateAppButton={canSeeUpdateAppButton}
      hasUser={Boolean(user)}
      openStore={openStore}
      scrollRef={scrollRef}
      shouldShowDevTools={shouldShowDevTools}
      statusPageUrl={statusPageUrl.value}
      updateBundle={updateBundle}
      websiteUrl={websiteUrl.value}
    />
  );
}
