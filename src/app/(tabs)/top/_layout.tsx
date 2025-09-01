import { Stack } from 'expo-router';

// eslint-disable-next-line camelcase
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TopLayout() {
  return <Stack initialRouteName="top-streams" />;
}
