import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

const WEB_QUERY_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Platform.OS === 'web' ? WEB_QUERY_CACHE_MAX_AGE : undefined,
        refetchOnWindowFocus: false,
        structuralSharing: false,
        retry: 3,
        retryDelay: 3000,
      },
    },
  });
};

export const queryClient = createQueryClient();
