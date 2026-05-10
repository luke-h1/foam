import { Icon } from '@app/components/Icon/Icon';
import { router } from 'expo-router';

// Component which implements a back button for the navigation bar
export function BackButton() {
  if (router.canGoBack()) {
    return <Icon icon="arrow-left" onPress={() => router.back()} />;
  }

  return null;
}
