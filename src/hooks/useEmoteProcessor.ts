import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { SanitisedEmote } from '@app/types/emote';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { useCallback } from 'react';

interface UseEmoteProcessorParams {
  sevenTvGlobalEmotes: SanitisedEmote[];
  sevenTvChannelEmotes: SanitisedEmote[];
  sevenTvPersonalEmotes?: SanitisedEmote[];
  twitchGlobalEmotes: SanitisedEmote[];
  twitchChannelEmotes: SanitisedEmote[];
  ffzChannelEmotes: SanitisedEmote[];
  ffzGlobalEmotes: SanitisedEmote[];
  bttvChannelEmotes: SanitisedEmote[];
  bttvGlobalEmotes: SanitisedEmote[];
}

export const useEmoteProcessor = (params: UseEmoteProcessorParams) => {
  const processEmotes = useCallback(
    (
      inputString: string,
      userstate: UserStateTags | null,
      onComplete: (result: ParsedPart[]) => void,
      sevenTvPersonalEmotes?: SanitisedEmote[],
    ) => {
      const processParams = {
        inputString,
        userstate,
        ...params,
        sevenTvPersonalEmotes: sevenTvPersonalEmotes || [],
      };

      const result = processEmotesWorklet(processParams);

      onComplete(result);
    },
    [params],
  );

  return {
    processEmotes,
  };
};
