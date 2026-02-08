import { Icon } from '@app/components/Icon/Icon';
import { useAppNavigation } from '@app/hooks/useAppNavigation';

// Component which implements a back button for the navigation bar
export function BackButton() {
  const navigation = useAppNavigation();

  if (navigation.canGoBack()) {
    return <Icon icon="arrow-left" onPress={navigation.goBack} />;
  }

  return null;
}
