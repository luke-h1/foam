import { act, render } from '@testing-library/react-native';

import { EmoteCell } from '../EmoteCell';
import { emoteSheetAnimationBudget } from '../util/emoteSheetAnimationBudget';
import { emoteSheetScrollActivity } from '../util/emoteSheetScrollActivity';
import { createMenuEmote } from './__fixtures__/emoteMenuData.fixture';

const mockStartAnimating = jest.fn();
const mockStopAnimating = jest.fn();

jest.mock('expo-image', () => {
  const ReactModule = require('react');
  return {
    Image: ReactModule.forwardRef((_props: unknown, ref: unknown) => {
      ReactModule.useImperativeHandle(ref, () => ({
        startAnimating: mockStartAnimating,
        stopAnimating: mockStopAnimating,
      }));
      return null;
    }),
  };
});

describe('EmoteCell animation pause', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    emoteSheetScrollActivity.reset();
    emoteSheetAnimationBudget.reset();
    mockStartAnimating.mockClear();
    mockStopAnimating.mockClear();
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
    for (let i = 0; i < 24; i += 1) {
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
});
