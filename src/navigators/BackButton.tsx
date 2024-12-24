// Component which implements a back button for the navigation bar

import { HeaderAction } from '@app/components/ui/Header';
import useAppNavigation from '@app/hooks/useAppNavigation';

export default function BackButton() {
  const navigation = useAppNavigation();

  return <HeaderAction icon="arrow-left" onPress={navigation.goBack} />;
}
