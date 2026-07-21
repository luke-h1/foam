import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAuthContext } from '@app/context/AuthContext';
import { theme } from '@app/styles/themes';

export default function TabsLayout() {
  const { authState } = useAuthContext();
  const isLoggedIn = authState?.isLoggedIn ?? false;
  const { t } = useTranslation('tabs');
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';

  // Below iOS 26 the default scroll-edge appearance is transparent, so pin an opaque material.
  const liquidGlass = isLiquidGlassAvailable();

  return (
    <NativeTabs
      tintColor={theme.color.text[scheme]}
      minimizeBehavior='onScrollDown'
      blurEffect={liquidGlass ? undefined : 'systemChromeMaterial'}
      disableTransparentOnScrollEdge={!liquidGlass}
    >
      <NativeTabs.Trigger name='following' hidden={!isLoggedIn}>
        <NativeTabs.Trigger.Label>{t('following')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='person.2' md='group' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='top'>
        <NativeTabs.Trigger.Label>{t('top')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='chart.bar.xaxis' md='leaderboard' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='search' role='search'>
        <NativeTabs.Trigger.Label>{t('search')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='magnifyingglass' md='search' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='settings'>
        <NativeTabs.Trigger.Label>{t('settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='gearshape' md='settings' />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
