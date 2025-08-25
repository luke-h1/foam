import { Stack } from 'expo-router';

// eslint-disable-next-line camelcase
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function SettingsLayout() {
  return <Stack initialRouteName="index" />;
}
