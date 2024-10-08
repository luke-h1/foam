import twitchService, { Stream } from '@app/services/twitchService';
import { createQueryKeys } from '@lukemorales/query-key-factory';
import { UseQueryOptions } from '@tanstack/react-query';

const twitchQueries = createQueryKeys('twitchService', {
  getTopStreams: {
    queryFn: () => twitchService.getTopStreams(),
    queryKey: ['topStreams'],
  },
});

// const twitchQueries = {
//   getTopStreams(cursor?: string): UseQueryOptions<Stream[]> {
//     return {
//       queryKey: ['topStreams'],
//       queryFn: () => twitchService.getTopStreams(cursor),
//     };
//   },
// } as const;

export default twitchQueries;
