import { renderHook } from '@testing-library/react-native';
import { act, render } from '@testing-library/react-native';

import type { ChatListRef } from '@app/components/Chat/components/ChatList';
import * as RichChatMessageModule from '@app/components/Chat/components/ChatMessage/RichChatMessage';
import type { RichChatMessageProps } from '@app/components/Chat/components/ChatMessage/RichChatMessage.types';
import * as channelLoadActions from '@app/store/chat/actions/channelLoad';
import * as chatColorCachesActions from '@app/store/chat/actions/chatColorCaches';
import { chatTransientState$ } from '@app/store/chat/observables/chatTransientState';
import * as transientSelectorsModule from '@app/store/chat/react/transientSelectors';
import { createRef } from '@app/test/createRef';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import * as emoteProcessorModule from '@app/utils/chat/emoteProcessor';
import type { ParsedPart } from '@app/utils/chat/parsedPart';
import * as resolveCachedSenderColorModule from '@app/utils/chat/resolveCachedSenderColor/resolveCachedSenderColor';
import * as resolveMentionColorModule from '@app/utils/chat/resolveMentionColor';

import { useChatRowRenderer } from '../useChatRowRenderer';
import {
  createChatMessage,
  createEmoteData,
  createSevenTvEmote,
} from './__fixtures__/useChat.fixture';

const mockGetCurrentEmoteData = jest.spyOn(
  channelLoadActions,
  'getCurrentEmoteData',
);
const mockGetSessionCacheString = jest.spyOn(
  chatColorCachesActions,
  'getSessionCacheString',
);
const mockSetSessionCacheString = jest.spyOn(
  chatColorCachesActions,
  'setSessionCacheString',
);
const mockProcessEmotesWorklet = jest
  .spyOn(emoteProcessorModule, 'processEmotesWorklet')
  .mockImplementation((params: { inputString: string }) => [
    { type: 'text', content: `parsed:${params.inputString}` },
  ]);
const mockResolveMentionColor = jest
  .spyOn(resolveMentionColorModule, 'resolveMentionColor')
  .mockReturnValue('#mention-color');
jest
  .spyOn(resolveCachedSenderColorModule, 'resolveCachedSenderColor')
  .mockReturnValue('#resolved-sender');
/**
 * RichChatMessage is memo() wrapped (an object, not a function), so
 * jest.spyOn cannot wrap it - swap the export directly instead.
 */
const mockRichChatMessage = jest.fn<
  null,
  [RichChatMessageProps<NoticeVariants>]
>(() => null);
Object.defineProperty(RichChatMessageModule, 'RichChatMessage', {
  configurable: true,
  value: (props: RichChatMessageProps<NoticeVariants>) =>
    mockRichChatMessage(props),
});
const mockUseIsHighlightedReplyTargetMessage = jest.spyOn(
  transientSelectorsModule,
  'useIsHighlightedReplyTargetMessage',
);

type HighlightedReplyTargetUpdate =
  string | null | ((current: string | null) => string | null);

function replyTargetUpdater(
  update: HighlightedReplyTargetUpdate | undefined,
): (current: string | null) => string | null {
  if (update instanceof Function) {
    return update;
  }
  throw new Error('Expected a reply-target updater function');
}

function createChatListRef(
  scrollToItem: ChatListRef['scrollToItem'],
): ChatListRef {
  return {
    clearCaches: jest.fn(),
    flashScrollIndicators: jest.fn(),
    getAnimatableRef: jest.fn(),
    getNativeScrollRef: jest.fn(),
    getScrollableNode: jest.fn(),
    getScrollResponder: jest.fn(),
    getState: jest.fn(),
    reportContentInset: jest.fn(),
    scrollIndexIntoView: jest.fn(),
    scrollItemIntoView: jest.fn(),
    scrollToEnd: jest.fn(),
    scrollToIndex: jest.fn(),
    scrollToItem,
    scrollToOffset: jest.fn(),
    setItemSize: jest.fn(),
    setScrollProcessingEnabled: jest.fn(),
    setVisibleContentAnchorOffset: jest.fn(),
  };
}

function renderRowRenderer() {
  const highlightedReplyTargetTimeoutRef = { current: null };
  const scrollToItem = jest.fn().mockResolvedValue(undefined);
  const listRef = createRef<ChatListRef | null>(
    createChatListRef(scrollToItem),
  );
  const messages = [
    createChatMessage({
      tags: {
        id: 'msg-1',
      },
    }),
    createChatMessage({
      overrides: {
        parentDisplayName: 'ParentUser',
        replyBody: 'parent body',
      },
      tags: {
        id: 'msg-2',
        login: 'viewer',
        'display-name': 'Viewer',
        'user-id': 'viewer-1',
      },
      text: 'hello OMEGALUL',
    }),
  ];
  const setHighlightedReplyTargetMessageId = jest.fn<
    void,
    [HighlightedReplyTargetUpdate]
  >();
  const onBadgePress = jest.fn();
  const onEmotePress = jest.fn();
  const onMessageLongPress = jest.fn();
  const onUsernamePress = jest.fn();

  const hook = renderHook(() =>
    useChatRowRenderer({
      channelId: 'channel-1',
      highlightedReplyTargetTimeoutRef,
      highlightedUsers: ['VIPUser', 'viewer'],
      listRef,
      messages$: {
        peek: jest.fn(() => messages),
      },
      onBadgePress,
      onEmotePress,
      onMessageLongPress,
      onUsernamePress,
      preferences: {
        animate: true,
        chatDensity: 'compact',
        chatTimestamps: true,
        disableEmoteAnimations: true,
        highlightOwnMentions: true,
        showAlternatingChatRows: true,
        showInlineReplyContext: true,
      },
      setHighlightedReplyTargetMessageId,
      user: {
        display_name: 'Viewer',
        login: 'viewer',
      },
    }),
  );

  return {
    highlightedReplyTargetTimeoutRef,
    hook,
    listRef,
    scrollToItem,
    messages,
    onEmotePress,
    onMessageLongPress,
    onUsernamePress,
    setHighlightedReplyTargetMessageId,
  };
}

describe('useChatRowRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockGetCurrentEmoteData.mockReturnValue(
      createEmoteData({
        sevenTvChannelEmotes: [createSevenTvEmote()],
      }),
    );
    mockGetSessionCacheString.mockReturnValue(undefined);
    chatTransientState$['channel-1']!.highlightedReplyTargetMessageId.set(
      'msg-2',
    );
  });

  test('builds list metadata from row preferences and highlighted users', () => {
    const { hook, messages } = renderRowRenderer();
    const replyMessage = messages[1];
    if (!replyMessage) {
      throw new Error('Expected reply message fixture');
    }

    expect(hook.result.current.keyExtractor(replyMessage)).toBe('msg-2_msg-2');
    expect(hook.result.current.getItemType(replyMessage)).toBe(
      'user_chat-reply-w0',
    );
    expect(hook.result.current.messageListExtraData).toEqual({
      animate: true,
      chatDensity: 'compact',
      currentUsernameNormalized: 'viewer',
      customHighlightsKey: '',
      disableEmoteAnimations: true,
      fontScale: undefined,
      highlightedUsersKey: 'VIPUser|viewer',
      // mentionLoginRevision intentionally excluded from extraData (would
      // re-render every row per mention resolve); MentionSpan subscribes to it.
      showAlternatingChatRows: true,
      showInlineReplyContext: true,
      showTimestamps: true,
    });
  });

  test('renders a real chat row with display flags, callbacks, mentions, and emote parsing', () => {
    const { hook, messages, onEmotePress, onUsernamePress } =
      renderRowRenderer();
    const replyMessage = messages[1];
    if (!replyMessage) {
      throw new Error('Expected reply message fixture');
    }
    replyMessage.timestamp = '12:34';

    const rendered = hook.result.current.renderItem({
      item: replyMessage,
      index: 1,
      target: 'Cell',
    });
    if (!rendered) {
      throw new Error('Expected renderItem to return an element');
    }

    render(rendered);

    const props = mockRichChatMessage.mock.calls[0]?.[0];
    if (
      !props?.parseTextForEmotes ||
      !props.getMentionColor ||
      !props.onEmotePress ||
      !props.onUsernamePress
    ) {
      throw new Error('Expected RichChatMessage callback props');
    }
    expect({
      currentUsername: props?.currentUsername,
      currentUsernameNormalized: props?.currentUsernameNormalized,
      density: props?.density,
      highlightedUserSet: [...(props?.highlightedUserSet ?? [])],
      messageDisplay: props?.messageDisplay,
      onEmotePress: props?.onEmotePress,
      onUsernamePress: props?.onUsernamePress,
    }).toEqual({
      currentUsername: 'viewer',
      currentUsernameNormalized: 'viewer',
      density: 'compact',
      highlightedUserSet: ['vipuser', 'viewer'],
      messageDisplay: {
        disableEmoteAnimations: true,
        isAlternatingRow: true,
        isAnnouncement: undefined,
        isChannelPointRedemption: false,
        isHighlightedMessage: undefined,
        isHighlightedMessageTarget: true,
        isSharedChatDuplicated: undefined,
        isTwitchSystemNotice: undefined,
        showInlineReplyContext: true,
        showTimestamp: true,
      },
      onEmotePress,
      onUsernamePress,
    });

    expect(props.timestamp).toBe('12:34');

    expect(props.parseTextForEmotes('OMEGALUL')).toEqual<ParsedPart[]>([
      { type: 'text', content: 'parsed:OMEGALUL' },
    ]);
    expect(mockProcessEmotesWorklet.mock.calls[0]?.[0].inputString).toBe(
      'OMEGALUL',
    );
    expect(props.getMentionColor('@DisplayName')).toBe('#mention-color');
    expect(mockResolveMentionColor).toHaveBeenCalledWith('@DisplayName');
    expect(mockSetSessionCacheString.mock.calls[0]).toEqual([
      'mentionColors',
      'displayname',
      '#mention-color',
    ]);
    expect(mockUseIsHighlightedReplyTargetMessage).toHaveBeenCalledWith(
      'channel-1',
      'msg-2',
    );
  });

  test('reply context press scrolls to the parent message and clears the highlight after the timeout', () => {
    jest.useFakeTimers();
    try {
      const {
        hook,
        messages,
        scrollToItem,
        setHighlightedReplyTargetMessageId,
      } = renderRowRenderer();
      const replyMessage = messages[1];
      if (!replyMessage) {
        throw new Error('Expected reply message fixture');
      }

      const rendered = hook.result.current.renderItem({
        item: replyMessage,
        index: 1,
        target: 'Cell',
      });
      if (!rendered) {
        throw new Error('Expected renderItem to return an element');
      }

      render(rendered);
      const props = mockRichChatMessage.mock.calls[0]?.[0];
      const onReplyContextPress = props?.onReplyContextPress;
      if (!onReplyContextPress) {
        throw new Error('Expected onReplyContextPress callback');
      }

      act(() => {
        onReplyContextPress('msg-1');
      });

      expect(scrollToItem.mock.calls[0]?.[0]).toEqual({
        animated: true,
        item: messages[0],
        viewPosition: 0.35,
      });
      expect(setHighlightedReplyTargetMessageId.mock.calls[0]).toEqual([
        'msg-1',
      ]);

      act(() => {
        jest.advanceTimersByTime(2200);
      });

      const clearHighlight = replyTargetUpdater(
        setHighlightedReplyTargetMessageId.mock.calls[1]?.[0],
      );
      expect(clearHighlight('msg-1')).toBe(null);
      expect(clearHighlight('different-message')).toBe('different-message');
    } finally {
      jest.useRealTimers();
    }
  });

  test('returns null for non-renderable rows and plain text when emote data is missing', () => {
    mockGetCurrentEmoteData.mockReturnValue(createEmoteData());
    const { hook } = renderRowRenderer();
    const invalidMessage = createChatMessage({
      overrides: {
        message_id: '',
      },
    });

    expect(
      hook.result.current.renderItem({
        item: invalidMessage,
        index: 0,
        target: 'Cell',
      }),
    ).toBe(null);
  });
});
