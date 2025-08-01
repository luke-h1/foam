import { Icon } from '@app/components';
import { useAppNavigation } from '@app/hooks';

// Component which implements a back button for the navigation bar
export function BackButton() {
  const navigation = useAppNavigation();

  if (navigation.canGoBack()) {
    return <Icon icon="arrow-left" onPress={navigation.goBack} />;
  }

  return null;
}
