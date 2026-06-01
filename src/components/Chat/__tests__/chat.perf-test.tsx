import type { ChatMessageType } from '@app/store/chatStore/constants';
import type { UserStateTags } from '@app/types/chat/irc-tags/userstate';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { View } from 'react-native';
import { measureFunction, measureRenders } from 'reassure';
import { ChatList } from '../components/ChatList';
import { RichChatMessage } from '../components/ChatMessage/RichChatMessage';
import { estimateChatMessageHeightWithPretext } from '../util/pretextChatHeight';
import type { AnyChatMessageType } from '../util/messageHandlers';
import { getVisibleMessages } from '../util/visibleMessages';

type PerfChatMessage = ChatMessageType<'usernotice'>;

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

function createMessageParts(index: number): ParsedPart[] {
  const messageKind = index % 5;

  if (messageKind === 0) {
    return [
      { type: 'text', content: 'hello ' },
      { type: 'mention', content: '@luke' },
      { type: 'text', content: ` message ${index}` },
    ];
  }

  if (messageKind === 1) {
    return [
      { type: 'text', content: 'classic stack ' },
      {
        type: 'emote',
        content: 'WW',
        id: `emote-${index}`,
        name: 'WW',
        url: 'https://cdn.7tv.app/emote/01F71VQYHR000D3ZZ6Q11NR7TV/4x.avif',
        static_url:
          'https://cdn.7tv.app/emote/01F71VQYHR000D3ZZ6Q11NR7TV/4x_static.avif',
        width: 128,
        height: 128,
        aspect_ratio: 1,
        zero_width: false,
      },
    ];
  }

  if (messageKind === 2) {
    return [{ type: 'text', content: `searchable slowmode note ${index}` }];
  }

  return [{ type: 'text', content: `regular chat message ${index}` }];
}

function createChatMessage(index: number): PerfChatMessage {
  const senderIndex = index % 24;
  const sender = `user${senderIndex}`;

  return {
    id: `msg-${index}_nonce-${index}`,
    message_id: `msg-${index}`,
    message_nonce: `nonce-${index}`,
    sender,
    channel: 'xqc',
    badges: [],
    cachedSenderColor: 'rgb(145, 70, 255)',
    message: createMessageParts(index),
    replyBody: '',
    replyDisplayName: '',
    parentDisplayName: '',
    timestamp: '12:00',
    userstate: {
      username: sender,
      login: sender.toLowerCase(),
      color: '#9146ff',
      'display-name': sender,
      'user-id': `user-id-${senderIndex}`,
      badges: {},
      'badges-raw': '',
      'user-type': '',
      mod: '0',
      subscriber: '0',
      turbo: '0',
      'emote-sets': '',
      id: `msg-${index}`,
    } as UserStateTags,
  };
}

const chatWindow = Array.from({ length: 600 }, (_, index) =>
  createChatMessage(index),
);
const visibleRows = chatWindow.slice(-120);

function isStandardUsernoticeMessage(
  message: AnyChatMessageType,
): message is PerfChatMessage {
  return !message.notice_tags;
}

function renderChatMessage(message: AnyChatMessageType) {
  if (!isStandardUsernoticeMessage(message)) {
    return null;
  }

  return (
    <RichChatMessage<'usernotice'>
      {...message}
      density='compact'
      currentUsername='luke'
      disableEmoteAnimations
    />
  );
}

function ChatListPerfFixture() {
  const listRef = { current: null };

  return (
    <ChatList
      data={visibleRows}
      extraData={{
        density: 'compact',
        showTimestamps: true,
      }}
      listRef={listRef}
      shouldMaintainScrollAtEnd={false}
      handleScroll={jest.fn()}
      handleScrollBeginDrag={jest.fn()}
      handleScrollEndDrag={jest.fn()}
      handleMomentumScrollEnd={jest.fn()}
      handleEndReached={jest.fn()}
      handleContentSizeChange={jest.fn()}
      keyExtractor={(item, index) => item?.id ?? `missing-${index}`}
      getItemType={() => 'chat-message'}
      contentContainerStyle={undefined}
      renderItem={({ item }) => (item ? renderChatMessage(item) : null)}
    />
  );
}

function RichMessageRowsPerfFixture() {
  return (
    <View>
      {visibleRows.map(message => (
        <RichChatMessage
          key={message.id}
          {...message}
          density='compact'
          currentUsername='luke'
          disableEmoteAnimations
        />
      ))}
    </View>
  );
}

describe('chat performance', () => {
  test('renders the chat list window', async () => {
    await measureRenders(<ChatListPerfFixture />, MEASURE_OPTIONS);
  });

  test('renders visible chat message rows', async () => {
    await measureRenders(<RichMessageRowsPerfFixture />, MEASURE_OPTIONS);
  });

  test('filters the bounded chat window', async () => {
    await measureFunction(() => {
      getVisibleMessages(chatWindow, {
        currentUsername: 'luke',
        hiddenPhrases: ['slowmode'],
        hiddenUsers: ['user7', 'user11'],
        searchQuery: 'message',
        showOnlyMentions: false,
      });
    }, MEASURE_OPTIONS);
  });

  test('estimates plain chat row heights with pretext', async () => {
    await measureFunction(() => {
      for (const message of visibleRows) {
        estimateChatMessageHeightWithPretext(message, {
          containerWidth: 390,
          density: 'compact',
          showTimestamp: true,
        });
      }
    }, MEASURE_OPTIONS);
  });
});
