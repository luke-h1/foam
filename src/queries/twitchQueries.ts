import twitchService, { Stream } from '@app/services/twitchService';
import { createQueryKeys } from '@lukemorales/query-key-factory';

const twitchQueries = createQueryKeys('twitchService', {
  getTopStreams: {
    queryFn: () => twitchService.getTopStreams(),
    queryKey: ['topStreams'],
  },
});

export default twitchQueries;
