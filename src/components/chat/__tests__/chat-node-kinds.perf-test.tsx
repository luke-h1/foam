import { View } from 'react-native';

import { measureRenders } from 'reassure';

import {
  busyChatRow,
  busyChatRows,
  type ChatNodeKindFixture,
  chatNodeKinds,
  PAINTED_USER_ID_PREFIX,
} from '@app/components/chat/__tests__/__fixtures__/chat-node-kinds.fixture';
import { sevenTvPaintsFixture } from '@app/components/chat/components/chat-message/__fixtures__/seven-tv-paints.fixture';
import { ChatRow } from '@app/components/chat/components/chat-message/chat-row';
import { ChatRowItem } from '@app/components/chat/components/chat-message/chat-row-item';
import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchService } from '@app/services/twitch-service';
import { addPaint, setUserPaint } from '@app/store/chat/actions/cosmetics';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { paintRendererFlag$, preferences$ } from '@app/store/preference-store';
import { DefaultWrapper } from '@app/test/render';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import type { TwitchClip } from '@app/types/twitch/clip';
import { convertV4PaintToPaintData } from '@app/utils/color/seven-tv-paint-data/convert-v4-paint-to-paint-data';

/**
 * `ChatRowItem` registers with the list's viewability tracker, which only
 * exists inside a mounted LegendList; the row itself is what is measured.
 */
jest.mock('@legendapp/list/react-native', () => ({
  ...jest.requireActual<typeof import('@legendapp/list/react-native')>(
    '@legendapp/list/react-native',
  ),
  useViewability: () => {},
}));

/**
 * Stub so a media link card never fetches. SAFETY: the resolved value is never
 * read, it only satisfies the return type.
 */
jest.spyOn(twitchService, 'getClip').mockResolvedValue({} as TwitchClip);

/**
 * Same for the 7TV emote card: a request that never settles, so no cast and
 * no error path.
 */
jest
  .spyOn(sevenTvService, 'getEmote')
  .mockImplementation(() => new Promise<never>(() => {}));

const MEASURE_OPTIONS = {
  runs: 10,
  warmupRuns: 2,
} as const;

/**
 * Paint slots the fixture's painted senders point at: a linear gradient with
 * shadows, a radial gradient with shadows, and an image paint.
 */
const PAINT_FIXTURE_INDEXES = [0, 1, 4];

const noop = () => {};

const getMentionColor = (username: string) =>
  username.length % 2 === 0 ? '#1e90ff' : '#ff69b4';

interface NodeKindRowsProps {
  messages: AnyChatMessageType[];
  row: ChatNodeKindFixture['row'];
}

function NodeKindRows({ messages, row }: NodeKindRowsProps) {
  return (
    <View>
      {messages.map(message => (
        <ChatRow<'usernotice', keyof UserNoticeVariantMap>
          key={message.id}
          {...message}
          broadcasterId='broadcaster-1'
          currentUsername='luke'
          currentUsernameNormalized='luke'
          customHighlights={row.customHighlights}
          density={row.density}
          fontScale={row.fontScale}
          getMentionColor={getMentionColor}
          highlightedUserSet={row.highlightedUserSet}
          messageDisplay={row.messageDisplay}
          onBadgePress={noop}
          onEmotePress={noop}
          onMessageLongPress={noop}
          onReplyContextPress={noop}
          onUsernamePress={noop}
        />
      ))}
    </View>
  );
}

const plainTextKind = chatNodeKinds.find(kind => kind.id === 'plain-text')!;

/**
 * The production row: `ChatRowItem` around `ChatRow`, as the list renders it.
 */
function ProductionRows() {
  return (
    <View>
      {plainTextKind.messages.map((message, index) => (
        <ChatRowItem
          key={message.id}
          chatDensity={plainTextKind.row.density}
          channelId='broadcaster-1'
          currentUsername='luke'
          currentUsernameNormalized='luke'
          customHighlights={plainTextKind.row.customHighlights}
          displayFlags={{
            animate: false,
            disableEmoteAnimations: true,
            fontScale: plainTextKind.row.fontScale,
            showAlternatingChatRows: false,
            showInlineReplyContext: true,
            showTimestamps: true,
          }}
          getMentionColor={getMentionColor}
          highlightedUserSet={plainTextKind.row.highlightedUserSet ?? new Set()}
          index={index}
          message={message}
          onBadgePress={noop}
          onEmotePress={noop}
          onMessageLongPress={noop}
          onReplyContextPress={noop}
          onUsernamePress={noop}
          parseTextForEmotes={parseTextForEmotes}
        />
      ))}
    </View>
  );
}

const parseTextForEmotes = (text: string) => [
  { type: 'text' as const, content: text },
];

beforeAll(() => {
  preferences$.sevenTvPaintRenderer.set('native');
  paintRendererFlag$.set('native');

  PAINT_FIXTURE_INDEXES.forEach((fixtureIndex, slot) => {
    const paint = convertV4PaintToPaintData(
      sevenTvPaintsFixture[fixtureIndex]!,
    );
    addPaint(paint);
    setUserPaint(`${PAINTED_USER_ID_PREFIX}${slot}`, paint.id);
  });
});

describe('chat node kinds', () => {
  test.each(chatNodeKinds.map(kind => [kind.id, kind] as const))(
    'renders a screen of %s rows',
    async (id, kind) => {
      // A media link card reads react-query, so that kind alone gets the
      // app's provider wrapper; every other kind renders bare.
      const options =
        id === 'media-links'
          ? { ...MEASURE_OPTIONS, wrapper: DefaultWrapper }
          : MEASURE_OPTIONS;

      await measureRenders(
        <NodeKindRows messages={kind.messages} row={kind.row} />,
        options,
      );
    },
  );

  test('renders a screen of plain-text rows through ChatRowItem', async () => {
    await measureRenders(<ProductionRows />, MEASURE_OPTIONS);
  });

  test('renders a busy chat screen', async () => {
    await measureRenders(
      <NodeKindRows messages={busyChatRows} row={busyChatRow} />,
      MEASURE_OPTIONS,
    );
  });
});
