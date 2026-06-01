import { theme } from '@app/styles/themes';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={theme.colorDarkGreen}
      iconColor={{
        default: theme.colorGreyAlpha,
        selected: theme.colorDarkGreen,
      }}
    >
      <NativeTabs.Trigger name='following'>
        <NativeTabs.Trigger.Label>Following</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='person.2' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='top'>
        <NativeTabs.Trigger.Label>Top</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf='chart.bar.xaxis' />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name='search'>
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
