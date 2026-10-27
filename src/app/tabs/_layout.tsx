import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { NativeTabs } from 'expo-router/native-tabs';

import { useAuthContext } from '@app/context/AuthContext';
import { useDuoLandscapeTabBarNudge } from '@app/hooks/use-duo-landscape-tab-bar-nudge';
import { theme } from '@app/styles/themes';

export default function TabsLayout() {
  const { authState } = useAuthContext();
  const isLoggedIn = authState?.isLoggedIn ?? false;
  const nudgeTabBar = useDuoLandscapeTabBarNudge();

  // Below iOS 26 the default scroll-edge appearance is transparent, so pin an opaque material.
  const liquidGlass = isLiquidGlassAvailable();

  return (
    <NativeTabs
      hidden={nudgeTabBar}
      disableHiddenAnimation
      tintColor={theme.colorWhite}
      minimizeBehavior='onScrollDown'
      sidebarAdaptable
      {...(!liquidGlass ? { blurEffect: 'systemChromeMaterial' as const } : {})}
      disableTransparentOnScrollEdge={!liquidGlass}
      {...(process.env.EXPO_OS === 'android'
        ? {
            // Pin the Android tab bar to app tokens; OEM overlays can recolor the activity-theme Material defaults away from the iOS-matched palette.
            backgroundColor: theme.color.backgroundSecondary.dark,
            iconColor: {
              default: theme.color.textSecondary.dark,
              selected: theme.color.text.dark,
            },
          }
        : {})}
      indicatorColor='rgba(255, 255, 255, 0.12)'
      rippleColor='rgba(255, 255, 255, 0.12)'
    >
      <NativeTabs.Trigger
        name='following'
        hidden={!isLoggedIn}
        disableScrollToTop
      >
        <NativeTabs.Trigger.Label>Following</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='person.2' md='group' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='top' disableScrollToTop>
        <NativeTabs.Trigger.Label>Top</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='chart.bar.xaxis' md='leaderboard' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='search' disableScrollToTop>
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
