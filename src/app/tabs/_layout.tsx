import { useAuthContext } from '@app/context/AuthContext';
import { theme } from '@app/styles/themes';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  const { authState } = useAuthContext();
  const isLoggedIn = authState?.isLoggedIn ?? false;

  return (
    <NativeTabs tintColor={theme.colorWhite} minimizeBehavior='onScrollDown'>
      <NativeTabs.Trigger name='following' hidden={!isLoggedIn}>
        <NativeTabs.Trigger.Label>Following</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='person.2' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='top'>
        <NativeTabs.Trigger.Label>Top</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='chart.bar.xaxis' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='search' role='search'>
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='magnifyingglass' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='settings'>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='gearshape' />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
