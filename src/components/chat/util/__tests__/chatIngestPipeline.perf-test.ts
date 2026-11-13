import { renderHook } from '@testing-library/react-native';
import { measureFunction } from 'reassure';

import { createScrollAnchor } from '@app/components/chat/hooks/__tests__/__fixtures__/use-chat-scroll.fixture';
import { useChatMessageProcessing } from '@app/components/chat/hooks/use-chat-message-processing';
import type { BufferedMessage } from '@app/components/chat/util/buffered-message-ops/types';
import { createChatIngestController } from '@app/components/chat/util/chatIngestController';
import { createChatIrcHandlers } from '@app/components/chat/util/createChatIrcHandlers';
import { consumeIrcLines } from '@app/components/chat/util/irc-client/consumeIrcLines';
import { createRoomStateTracker } from '@app/components/chat/util/room-state/roomStateTracker';
import * as channelLoad from '@app/store/chat/actions/channel-load';
import { clearMessages } from '@app/store/chat/actions/messages';
import * as personalEmotes from '@app/store/chat/actions/personal-emotes';
import { chatStore$ } from '@app/store/chat/observables/chat-store';
import * as chatIngestRateLimiter from '@app/utils/chat/chatIngestRateLimiter';
import * as getChannelCheermotesModule from '@app/utils/chat/cheermote-store/getChannelCheermotes';
import { routeIrcMessage } from '@app/utils/chat/irc-protocol/routeIrcMessage';

import {
  PIPELINE_CHANNEL_ID,
  pipelineEmoteData,
  pipelineLineBatches,
} from './__fixtures__/chatIngestPipeline.fixture';

jest
  .spyOn(channelLoad, 'getCurrentEmoteData')
  .mockReturnValue(pipelineEmoteData);

jest.spyOn(personalEmotes, 'getUserPersonalEmotes').mockReturnValue([]);

jest
  .spyOn(getChannelCheermotesModule, 'getChannelCheermotes')
  .mockReturnValue(undefined);

// The token bucket would drop most of a tight synthetic loop.
jest
  .spyOn(chatIngestRateLimiter, 'shouldProcessLiveMessage')
  .mockReturnValue(true);

const MEASURE_OPTIONS = {
  runs: 10,
  warmupRuns: 2,
} as const;

const noop = () => {};

function createPipeline() {
  let finalize: (message: BufferedMessage) => BufferedMessage = message =>
    message;

  const controller = createChatIngestController({
    getFinalizeMessageForCommit: () => finalize,
    getChatDelayMs: () => 0,
    isAtBottom: () => true,
    isRowTouchHeld: () => false,
    isScrollingToBottom: () => false,
    isUserActivelyScrolling: () => false,
    onBottomContentChange: noop,
  });

  const { result } = renderHook(() =>
    useChatMessageProcessing({
      channelId: PIPELINE_CHANNEL_ID,
      handleNewMessage: controller.handleNewMessage,
      messages$: chatStore$.messages,
      scrollAnchor: createScrollAnchor(),
      show7TvEmotes: true,
      showChatGifs: false,
      userLogin: 'luke',
    }),
  );

  finalize = result.current.finalizeBufferedMessage;

  const handlers = createChatIrcHandlers({
    channelId: PIPELINE_CHANNEL_ID,
    channelName: 'perfchannel',
    clearLocalMessages: controller.clearLocalMessages,
    handleNewMessage: controller.handleNewMessage,
    listRef: { current: null },
    messages$: chatStore$.messages,
    moderateChatMessageById: controller.moderateChatMessageById,
    moderateChatMessagesByLogin: controller.moderateChatMessagesByLogin,
    processMessageEmotes: result.current.processMessageEmotes,
    removeChatMessageById: controller.removeChatMessageById,
    removeChatMessagesByLogin: controller.removeChatMessagesByLogin,
    roomStateTracker: createRoomStateTracker(),
  });

  const lineHandlers = {
    onDebugLine: noop,
    onPing: noop,
    onLine: (message: Parameters<typeof routeIrcMessage>[0]) => {
      routeIrcMessage(message, { privmsg: handlers.onMessage });
    },
  };

  return { controller, lineHandlers };
}

describe('chat ingest pipeline performance', () => {
  beforeEach(() => {
    clearMessages();
    chatStore$.currentChannelId.set(PIPELINE_CHANNEL_ID);
    chatStore$.recentMessagesByChannel.set({});
  });

  afterEach(() => {
    clearMessages();
    chatStore$.currentChannelId.set(null);
    chatStore$.recentMessagesByChannel.set({});
  });

  test('takes raw PRIVMSG lines through parse, buffer and commit', async () => {
    const { controller, lineHandlers } = createPipeline();

    await measureFunction(() => {
      clearMessages();

      for (const batch of pipelineLineBatches) {
        consumeIrcLines(batch, lineHandlers);
        controller.forceFlush();
      }
    }, MEASURE_OPTIONS);

    expect(chatStore$.messages.peek().length).toBeGreaterThan(0);
  });
});
