import { useRef } from 'react';
import { Platform, ScrollView } from 'react-native';

import { router } from 'expo-router';

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
import { SettingsIndexIosForm } from './components/SettingsIndexIosForm';

function handleSendFeedback() {
  router.push('/feedback');
}

const variant = process.env.EXPO_PUBLIC_APP_VARIANT;

export function SettingsIndexScreen() {
  const { user } = useAuthContext();
  const { config } = useRemoteConfig();
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

  const sharedProps = {
    isLoggedIn: Boolean(user),
    shouldShowDevTools,
    statusPageUrl: statusPageUrl.value,
    websiteUrl: websiteUrl.value,
    bundleButtonEnabled: configBundleButtonEnabled.value.ios[variant],
    canSeeUpdateAppButton: isUpdateAppButtonAllowed(
      user?.login,
      config.updateAppButtonAllowedUsers.value,
    ),
    openStore,
    updateBundle,
    onSendFeedback: handleSendFeedback,
  };

  if (Platform.OS === 'ios') {
    return <SettingsIndexIosForm {...sharedProps} />;
  }

  return <SettingsIndexAndroidList {...sharedProps} scrollRef={scrollRef} />;
}
