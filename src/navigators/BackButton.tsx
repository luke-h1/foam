// Component which implements a back button for the navigation bar

import { HeaderAction } from '@app/components/ui/Header';

export default function BackButton() {
  const navigation = useAppNavigation();

  return <HeaderAction icon="back" onPress={navigation.goBack} />;
}
