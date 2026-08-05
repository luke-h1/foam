import { act, render } from '@testing-library/react-native';

import {
  createRowVisibilityStore,
  RowVisibilityContext,
} from '@app/components/Chat/components/ChatMessage/rowVisibility';

import { EmoteCell } from '../EmoteCell';
import {
  emoteSheetAnimationBudget,
  MAX_CONCURRENT_ANIMATED,
} from '../util/emoteSheetAnimationBudget';
import { emoteSheetScrollActivity } from '../util/emoteSheetScrollActivity';
import { createMenuEmote } from './__fixtures__/emoteMenuData.fixture';

const mockStartAnimating = jest.fn();
const mockStopAnimating = jest.fn();
let lastOnDisplay: (() => void) | undefined;

jest.mock('expo-image', () => {
  const ReactModule = require('react');
  return {
    Image: ReactModule.forwardRef(
      (props: { onDisplay?: () => void }, ref: unknown) => {
        lastOnDisplay = props.onDisplay;
        ReactModule.useImperativeHandle(ref, () => ({
          startAnimating: mockStartAnimating,
          stopAnimating: mockStopAnimating,
        }));
        return null;
      },
    ),
  };
});

describe('EmoteCell animation pause', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    emoteSheetScrollActivity.reset();
    emoteSheetAnimationBudget.reset();
    mockStartAnimating.mockClear();
    mockStopAnimating.mockClear();
    lastOnDisplay = undefined;
  });
  afterEach(() => {
    emoteSheetScrollActivity.reset();
    emoteSheetAnimationBudget.reset();
    jest.useRealTimers();
  });

  test('pauses the emote while the grid scrolls and resumes when it settles', () => {
    render(
      <EmoteCell
        cellSize={40}
        item={createMenuEmote('a', 'a', '7TV Global')}
      />,
    );

    expect(mockStartAnimating).toHaveBeenCalledTimes(1);
    mockStartAnimating.mockClear();

    act(() => emoteSheetScrollActivity.poke());
    expect(mockStopAnimating).toHaveBeenCalledTimes(1);
    expect(mockStartAnimating).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(150));
    expect(mockStartAnimating).toHaveBeenCalledTimes(1);
  });

  test('freezes an emote that mounts mid-fling', () => {
    act(() => emoteSheetScrollActivity.poke());

    render(
      <EmoteCell
        cellSize={40}
        item={createMenuEmote('b', 'b', '7TV Global')}
      />,
    );

    expect(mockStopAnimating).toHaveBeenCalledTimes(1);
  });

  test('leaves cells past the animation cap on their first frame', () => {
    const held: (() => void)[] = [];
    for (let i = 0; i < MAX_CONCURRENT_ANIMATED; i += 1) {
      held.push(emoteSheetAnimationBudget.acquire(() => undefined));
    }
    mockStartAnimating.mockClear();

    render(
      <EmoteCell
        cellSize={40}
        item={createMenuEmote('c', 'c', '7TV Global')}
      />,
    );

    expect(mockStartAnimating).not.toHaveBeenCalled();

    held.forEach(release => release());
  });

  test('replays the animation command once the image is on screen', () => {
    render(
      <EmoteCell
        cellSize={40}
        item={createMenuEmote('d', 'd', '7TV Global')}
      />,
    );

    // The command the cell issues on mount lands before the view has an image
    // to animate, so the one it issues on display is the one that plays it.
    mockStartAnimating.mockClear();
    act(() => lastOnDisplay?.());

    expect(mockStartAnimating).toHaveBeenCalledTimes(1);
  });

  test('holds no animation slot while its row is off screen', () => {
    const offScreenRow = createRowVisibilityStore(false);

    render(
      <RowVisibilityContext.Provider value={offScreenRow}>
        <EmoteCell
          cellSize={40}
          item={createMenuEmote('e', 'e', '7TV Global')}
        />
      </RowVisibilityContext.Provider>,
    );

    expect(mockStartAnimating).not.toHaveBeenCalled();

    act(() => offScreenRow.setVisible(true));
    expect(mockStartAnimating).toHaveBeenCalledTimes(1);

    act(() => offScreenRow.setVisible(false));
    expect(mockStopAnimating).toHaveBeenCalledTimes(1);
  });

  test('frees its slot for another cell when the row scrolls off screen', () => {
    const rows = Array.from({ length: MAX_CONCURRENT_ANIMATED }, () =>
      createRowVisibilityStore(true),
    );
    rows.forEach((row, index) => {
      render(
        <RowVisibilityContext.Provider value={row}>
          <EmoteCell
            cellSize={40}
            item={createMenuEmote(
              `full-${index}`,
              `full-${index}`,
              '7TV Global',
            )}
          />
        </RowVisibilityContext.Provider>,
      );
    });

    const waiting = createRowVisibilityStore(true);
    render(
      <RowVisibilityContext.Provider value={waiting}>
        <EmoteCell
          cellSize={40}
          item={createMenuEmote('waiting', 'waiting', '7TV Global')}
        />
      </RowVisibilityContext.Provider>,
    );
    mockStartAnimating.mockClear();

    act(() => rows[0]?.setVisible(false));

    expect(mockStartAnimating).toHaveBeenCalledTimes(1);
  });
});
