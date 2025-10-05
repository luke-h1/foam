import { twitchService } from '@app/services/twitch-service';
import { useEffect, useState, useMemo } from 'react';

export function useStreamerImages(logins: string[]) {
  const [profilePictures, setProfilePictures] = useState<Map<string, string>>(
    new Map(),
  );
  const [loading, setLoading] = useState<boolean>(false);

  const uniqueLogins = useMemo(() => Array.from(new Set(logins)), [logins]);

  useEffect(() => {
    const fetchProfilePictures = async () => {
      setLoading(true);
      try {
        // Only fetch for logins we don't already have
        const missingLogins = uniqueLogins.filter(
          login => !profilePictures.has(login),
        );

        if (missingLogins.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch profile pictures in parallel
        const promises = missingLogins.map(async login => {
          try {
            const profilePicture = await twitchService.getUserImage(login);
            return { login, profilePicture };
          } catch (error) {
            console.warn(
              `Failed to fetch profile picture for ${login}:`,
              error,
            );
            return { login, profilePicture: '' };
          }
        });

        const results = await Promise.all(promises);

        setProfilePictures(prev => {
          const newMap = new Map(prev);
          results.forEach(({ login, profilePicture }) => {
            newMap.set(login, profilePicture);
          });
          return newMap;
        });
      } catch (error) {
        console.error('Error fetching profile pictures:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfilePictures();
  }, [uniqueLogins, profilePictures]);

  return { profilePictures, loading };
}
