import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { useCallback } from 'react';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

interface UseEmoteProcessorParams {
  sevenTvGlobalEmotes: SanitisiedEmoteSet[];
  sevenTvChannelEmotes: SanitisiedEmoteSet[];
  twitchGlobalEmotes: SanitisiedEmoteSet[];
  twitchChannelEmotes: SanitisiedEmoteSet[];
  ffzChannelEmotes: SanitisiedEmoteSet[];
  ffzGlobalEmotes: SanitisiedEmoteSet[];
  bttvChannelEmotes: SanitisiedEmoteSet[];
  bttvGlobalEmotes: SanitisiedEmoteSet[];
}

export const useEmoteProcessor = (params: UseEmoteProcessorParams) => {
  const processingQueue = useSharedValue<ParsedPart[]>([]);
  const isProcessing = useSharedValue(false);

  const processEmotes = useCallback(
    (
      inputString: string,
      userstate: UserStateTags | null,
      onComplete: (result: ParsedPart[]) => void,
    ) => {
      if (isProcessing.value) {
        // If already processing, queue the request
        return;
      }

      isProcessing.value = true;

      const processParams = {
        inputString,
        userstate,
        ...params,
      };

      const result = processEmotesWorklet(processParams);

      processingQueue.value = result;

      runOnJS(onComplete)(result);

      isProcessing.value = false;
    },
    [params, processingQueue, isProcessing],
  );

  return {
    processEmotes,
    processingQueue,
    isProcessing,
  };
};
