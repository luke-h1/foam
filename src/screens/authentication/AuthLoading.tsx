import { useAuthContext } from '@app/context/AuthContext';
import { HomeTabsRoutes } from '@app/navigation/Home/HomeTabs';
import { useEffect } from 'react';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';

export default function AuthLoadingScreen({
  navigation,
}: RootStackScreenProps<RootRoutes.AuthLoading>) {
  const { navigate } = navigation;

  const { auth, getAnonToken } = useAuthContext();

  useEffect(() => {
    (async () => {
      if (!auth?.anonToken || !auth.token?.accessToken) {
        await getAnonToken()
          .then(() => {
            navigate(RootRoutes.Home, {
              screen: HomeTabsRoutes.Top,
            });
          })
          .catch(e => {
            // eslint-disable-next-line no-console
            console.error('e', e);
          });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
