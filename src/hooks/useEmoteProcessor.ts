import { SanitisiedEmoteSet } from '@app/services/seventv-service';
import { processEmotesWorklet } from '@app/utils/chat/emoteProcessor.worklet';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { useCallback } from 'react';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { ChatUserstate } from 'tmi.js';

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
      userstate: ChatUserstate | null,
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

      // Use worklet to process emotes in background thread
      const result = processEmotesWorklet(processParams);

      // Update the shared value
      processingQueue.value = result;

      // Call the completion callback on JS thread
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
