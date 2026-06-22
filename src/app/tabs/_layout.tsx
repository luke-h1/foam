import { useTranslation } from 'react-i18next';

import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAuthContext } from '@app/context/AuthContext';
import { theme } from '@app/styles/themes';

export default function TabsLayout() {
  const { authState } = useAuthContext();
  const isLoggedIn = authState?.isLoggedIn ?? false;
  const { t } = useTranslation('tabs');

  return (
    <NativeTabs tintColor={theme.colorWhite} minimizeBehavior='onScrollDown'>
      <NativeTabs.Trigger name='following' hidden={!isLoggedIn}>
        <NativeTabs.Trigger.Label>{t('following')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='person.2' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='top'>
        <NativeTabs.Trigger.Label>{t('top')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='chart.bar.xaxis' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='search' role='search'>
        <NativeTabs.Trigger.Label>{t('search')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='magnifyingglass' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='settings'>
        <NativeTabs.Trigger.Label>{t('settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='gearshape' />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
