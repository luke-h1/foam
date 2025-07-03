import { twitchService } from '@app/services';
import { useEffect, useState } from 'react';
import { DependencyList } from 'react-native-reanimated/lib/typescript/hook';

export function useStreamerImage(login: string, deps: DependencyList) {
  const [profilePicture, setProfilePicture] = useState<string>('');

  const fetchStreamerProfilePicture = async () => {
    const result = await twitchService.getUserImage(login);
    setProfilePicture(result);
  };

  useEffect(() => {
    void (async () => {
      await fetchStreamerProfilePicture();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  return {
    profilePicture,
  };
}
