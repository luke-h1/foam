import { twitchService } from '@app/services/twitch-service';
import { DependencyList, useEffect, useState } from 'react';

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
