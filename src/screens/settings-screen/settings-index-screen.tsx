import { useRef } from 'react';
import { Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthContext } from '@app/context/auth-context';
import { useRemoteConfig } from '@app/hooks/firebase/use-remote-config';
import { useAppUpdate } from '@app/hooks/use-app-update';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { isUpdateAppButtonAllowed } from '@app/utils/app-update/is-update-app-button-allowed';
import {
  isAdminLogin,
  isDevToolsEnabled,
} from '@app/utils/dev-tools/dev-tools-gate';

import { SettingsIndexAndroidList } from './components/settings-index-android-list';
import { SettingsIndexIOSForm } from './components/settings-index-ios-form';

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

  // The flag is keyed by build variant and only gates iOS. Android always
  // shows the update bundle row.
  const bundleButtonEnabled = config.bundleButtonEnabled.value.ios[variant];

  const canSeeUpdateAppButton = isUpdateAppButtonAllowed(
    user?.login,
    config.updateAppButtonAllowedUsers.value,
  );

  if (Platform.OS === 'ios') {
    return (
      <SettingsIndexIOSForm
        bundleButtonEnabled={bundleButtonEnabled}
        canSeeUpdateAppButton={canSeeUpdateAppButton}
        user={user}
        openStore={openStore}
        shouldShowDevTools={shouldShowDevTools}
        updateBundle={updateBundle}
      />
    );
  }

  return (
    <SettingsIndexAndroidList
      bottomInset={insets.bottom}
      canSeeUpdateAppButton={canSeeUpdateAppButton}
      user={user}
      openStore={openStore}
      scrollRef={scrollRef}
      shouldShowDevTools={shouldShowDevTools}
      updateBundle={updateBundle}
    />
  );
}
