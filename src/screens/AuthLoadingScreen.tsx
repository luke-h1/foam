import {
  HomeTabsParamList,
  HomeTabsRoutes,
} from '@app/navigation/Home/HomeTabs';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';

export default function AuthLoadingScreen() {
  // TODO: fix nav here
  const { navigate } = useNavigation<NavigationProp<HomeTabsParamList>>();

  useEffect(() => {
    navigate(HomeTabsRoutes.TopStack);
  }, [navigate]);
  return null;
}
