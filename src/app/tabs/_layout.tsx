import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useAuthContext } from '@app/context/AuthContext';
import { theme } from '@app/styles/themes';

export default function TabsLayout() {
  const { authState } = useAuthContext();
  const isLoggedIn = authState?.isLoggedIn ?? false;

  // Below iOS 26 the default scroll-edge appearance is transparent, so pin an opaque material.
  const liquidGlass = isLiquidGlassAvailable();

  return (
    <NativeTabs
      tintColor={theme.colorWhite}
      minimizeBehavior='onScrollDown'
      blurEffect={liquidGlass ? undefined : 'systemChromeMaterial'}
      disableTransparentOnScrollEdge={!liquidGlass}
      backgroundColor={
        // Pin the Android tab bar to app tokens; the Material defaults come from
        // the activity theme, which OEM overlays can recolor away from the
        // iOS-matched palette.
        process.env.EXPO_OS === 'android'
          ? theme.color.backgroundSecondary.dark
          : undefined
      }
      indicatorColor='rgba(255, 255, 255, 0.12)'
      rippleColor='rgba(255, 255, 255, 0.12)'
    >
      <NativeTabs.Trigger name='following' hidden={!isLoggedIn}>
        <NativeTabs.Trigger.Label>Following</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='person.2' md='group' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='top'>
        <NativeTabs.Trigger.Label>Top</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='chart.bar.xaxis' md='leaderboard' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='search' role='search'>
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='magnifyingglass' md='search' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='settings'>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='gearshape' md='settings' />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
