import useAppNavigation from '@app/hooks/useAppNavigation';
import { useEffect } from 'react';

export default function AuthLoadingScreen() {
  const { navigate } = useAppNavigation();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    navigate('Tabs', {
      screen: 'TopStack',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
