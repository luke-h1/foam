import { Icon } from '@app/components';
import { useRouter } from 'expo-router';

// Component which implements a back button for the navigation bar
export function BackButton() {
  const router = useRouter();

  if (router.canGoBack()) {
    return <Icon icon="arrow-left" onPress={router.back} />;
  }

  return null;
}
