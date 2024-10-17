import { HomeTabsRoutes } from '@app/navigation/Home/HomeTabs';
import { RootStackScreenProps, RootRoutes } from '@app/navigation/RootStack';
import { useEffect } from 'react';

export default function AuthLoadingScreen({
  navigation,
}: RootStackScreenProps<RootRoutes.AuthLoading>) {
  const { navigate } = navigation;

  // TODO: actually acquire auth tokens here

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setTimeout(() => {
      navigate(RootRoutes.Home, {
        screen: HomeTabsRoutes.Top,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
