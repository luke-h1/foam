import { type StyleProp, type TextStyle, View } from 'react-native';

import { act } from '@testing-library/react-native';
import { measureRenders } from 'reassure';

import { sevenTvPaintsFixture } from '@app/components/chat/components/chat-message/__fixtures__/seven-tv-paints.fixture';
import { styles } from '@app/components/chat/components/chat-message/ChatRow.styles';
import { getChatTextStyles } from '@app/components/chat/components/chat-message/ChatText.styles';
import { chatScrollActivity } from '@app/components/chat/util/chatScrollActivity';
import { paintRendererFlag$ } from '@app/store/preference-store';
import type { PaintData } from '@app/types/seven-tv/cosmetics';
import { convertV4PaintToPaintData } from '@app/utils/seven-tv/gql/convertV4PaintToPaintData';

import { PaintedUsername } from '../PaintedUsername';

jest.mock('../util/skiaPaintFonts', () => ({
  useSkiaPaintFontProvider: () => ({}),
}));

jest.mock('../util/paintCanvasRedraw', () => ({
  schedulePaintCanvasRedraw: () => {},
  cancelPaintCanvasRedraw: () => {},
}));

jest.mock('../util/skiaPaintedUsernameRasterizer', () => ({
  ...jest.requireActual<typeof import('../util/skiaPaintedUsernameRasterizer')>(
    '../util/skiaPaintedUsernameRasterizer',
  ),
  getPaintBitmaps: () => ({
    staticImage: {},
    maskImage: null,
    layerSlots: [],
    strokeImage: null,
    imageLayers: [],
    width: 60,
    height: 18,
    insets: { left: 0, top: 0, right: 0, bottom: 0 },
  }),
}));

jest.mock('@app/utils/image/paintBitmapCacheLifecycle', () => ({
  ...jest.requireActual<
    typeof import('@app/utils/image/paintBitmapCacheLifecycle')
  >('@app/utils/image/paintBitmapCacheLifecycle'),
  retainPaintBitmaps: () => true,
  releasePaintBitmaps: () => {},
}));

const MEASURE_OPTIONS = {
  runs: 10,
  warmupRuns: 2,
} as const;

const ROW_COUNT = 30;

const paints: PaintData[] = [0, 1].map(index =>
  convertV4PaintToPaintData(sevenTvPaintsFixture[index]!),
);

const usernameStyle = getChatTextStyles(undefined, 'comfortable').username;
const usernameTextStyle: StyleProp<TextStyle> = [usernameStyle, false];

const moderatedUsernameTextStyle: StyleProp<TextStyle> = [
  usernameStyle,
  styles.moderatedUsernameText,
];

interface PaintedRowsProps {
  painted: boolean;
}

function PaintedRows({ painted }: PaintedRowsProps) {
  return (
    <View>
      {Array.from({ length: ROW_COUNT }, (_, index) => {
        const isModerated = index % 3 === 0;

        return (
          <PaintedUsername
            key={index}
            fallbackColor='#9147FF'
            isModerated={isModerated}
            paint={painted ? paints[index % paints.length] : undefined}
            username={`chatter${index}`}
            usernameTextStyle={
              isModerated ? moderatedUsernameTextStyle : usernameTextStyle
            }
          />
        );
      })}
    </View>
  );
}

async function fling() {
  await act(async () => {
    chatScrollActivity.poke();
  });

  await act(async () => {
    chatScrollActivity.reset();
  });
}

afterEach(() => {
  chatScrollActivity.reset();
});

describe('PaintedUsername performance', () => {
  test('renders a screen of usernames with no paint', async () => {
    paintRendererFlag$.set('skia');

    await measureRenders(<PaintedRows painted={false} />, MEASURE_OPTIONS);
  });

  test('renders a screen of Skia painted usernames, a third moderated', async () => {
    paintRendererFlag$.set('skia');

    await measureRenders(<PaintedRows painted />, MEASURE_OPTIONS);
  });

  test('flings a screen of Skia painted usernames, a third moderated', async () => {
    paintRendererFlag$.set('skia');

    await measureRenders(<PaintedRows painted />, {
      ...MEASURE_OPTIONS,
      scenario: fling,
    });
  });

  test('flings a screen of hosted painted usernames', async () => {
    paintRendererFlag$.set('native');

    await measureRenders(<PaintedRows painted />, {
      ...MEASURE_OPTIONS,
      scenario: fling,
    });
  });
});
