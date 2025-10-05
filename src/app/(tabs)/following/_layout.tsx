import { Stack } from 'expo-router';

// eslint-disable-next-line camelcase
export const unstable_settings = {
  initialRouteName: 'index',
};

export default function FollowingLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
