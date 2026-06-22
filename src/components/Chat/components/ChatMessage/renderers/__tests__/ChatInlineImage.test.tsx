import { act, render, screen } from '@testing-library/react-native';

import {
  createRowVisibilityStore,
  RowVisibilityContext,
} from '@app/components/Chat/components/ChatMessage/rowVisibility';
import { evictCachedEmoteRef } from '@app/Providers/CachedEmotesProvider/cache-service';
import { logger } from '@app/utils/logger';

import { ChatInlineImage } from '../ChatInlineImage';

const mockStartAnimating = jest.fn();
const mockStopAnimating = jest.fn();

let mockImageProps: {
  onError?: () => void;
  onLoad?: () => void;
  recyclingKey?: string;
} | null = null;

jest.mock('expo-image', () => {
  const ReactModule = require('react');
  return {
    Image: ReactModule.forwardRef(
      (
        props: {
          onError?: () => void;
          onLoad?: () => void;
          recyclingKey?: string;
        },
        ref: unknown,
      ) => {
        mockImageProps = props;
        ReactModule.useImperativeHandle(ref, () => ({
          startAnimating: mockStartAnimating,
          stopAnimating: mockStopAnimating,
        }));
        return null;
      },
    ),
  };
});

let mockSharedRef: { isAnimated?: boolean } | null = null;

jest.mock('@app/Providers/CachedEmotesProvider/useCachedEmote', () => ({
  useCachedEmote: () => mockSharedRef,
}));

jest.mock('@app/Providers/CachedEmotesProvider/cache-service', () => ({
  evictCachedEmoteRef: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: { warn: jest.fn(), debug: jest.fn() },
  },
}));

const evictMock = jest.mocked(evictCachedEmoteRef);
const warnMock = jest.mocked(logger.chat.warn);

describe('ChatInlineImage off-screen pause', () => {
  beforeEach(() => {
    mockSharedRef = { isAnimated: true };
    mockImageProps = null;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('stops animation when the row mounts off-screen and resumes when it scrolls back in', () => {
    const store = createRowVisibilityStore(false);

    render(
      <RowVisibilityContext.Provider value={store}>
        <ChatInlineImage
          sourceUrl='https://cdn.7tv.app/emote/x/2x.avif'
          style={{}}
        />
      </RowVisibilityContext.Provider>,
    );

    expect(mockStopAnimating).toHaveBeenCalledTimes(1);
    expect(mockStartAnimating).not.toHaveBeenCalled();

    act(() => store.setVisible(true));
    expect(mockStartAnimating).toHaveBeenCalledTimes(1);

    act(() => store.setVisible(false));
    expect(mockStopAnimating).toHaveBeenCalledTimes(2);
  });

  test('attaches a catch to the animation command so a recycled-view rejection never goes unhandled (FOAM-TV-MOBILE-AH)', () => {
    const catchSpy = jest.fn();
    mockStartAnimating.mockReturnValueOnce({ catch: catchSpy });
    const store = createRowVisibilityStore(true);

    render(
      <RowVisibilityContext.Provider value={store}>
        <ChatInlineImage
          sourceUrl='https://cdn.7tv.app/emote/recycled/2x.avif'
          style={{}}
        />
      </RowVisibilityContext.Provider>,
    );

    act(() => store.setVisible(false));
    act(() => store.setVisible(true));

    expect(mockStartAnimating).toHaveBeenCalledTimes(1);
    expect(catchSpy).toHaveBeenCalledTimes(1);
  });

  test('does not touch animation on a visible mount (autoplay handles it)', () => {
    const store = createRowVisibilityStore(true);

    render(
      <RowVisibilityContext.Provider value={store}>
        <ChatInlineImage
          sourceUrl='https://cdn.7tv.app/emote/z/2x.avif'
          style={{}}
        />
      </RowVisibilityContext.Provider>,
    );

    expect(mockStartAnimating).not.toHaveBeenCalled();
    expect(mockStopAnimating).not.toHaveBeenCalled();

    act(() => store.setVisible(false));
    expect(mockStopAnimating).toHaveBeenCalledTimes(1);

    act(() => store.setVisible(true));
    expect(mockStartAnimating).toHaveBeenCalledTimes(1);
  });

  test('leaves animation running when there is no row context', () => {
    render(
      <ChatInlineImage
        sourceUrl='https://cdn.7tv.app/emote/y/2x.avif'
        style={{}}
      />,
    );

    expect(mockStartAnimating).not.toHaveBeenCalled();
    expect(mockStopAnimating).not.toHaveBeenCalled();
  });

  test('static images skip the pause path entirely, even off-screen', () => {
    mockSharedRef = { isAnimated: false };
    const store = createRowVisibilityStore(false);

    render(
      <RowVisibilityContext.Provider value={store}>
        <ChatInlineImage
          sourceUrl='https://cdn.7tv.app/badge/s/2x.png'
          style={{}}
        />
      </RowVisibilityContext.Provider>,
    );

    act(() => store.setVisible(true));
    act(() => store.setVisible(false));

    expect(mockStartAnimating).not.toHaveBeenCalled();
    expect(mockStopAnimating).not.toHaveBeenCalled();
  });
});

describe('ChatInlineImage error retry', () => {
  beforeEach(() => {
    mockSharedRef = { isAnimated: false };
    mockImageProps = null;
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('evicts the cached ref and remounts with a new recyclingKey after the backoff delay', () => {
    const sourceUrl = 'https://cdn.7tv.app/emote/err/2x.avif';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#0`);

    act(() => mockImageProps?.onError?.());

    expect(evictMock).toHaveBeenCalledTimes(1);
    expect(evictMock).toHaveBeenCalledWith(sourceUrl);
    // The reload is deferred behind the backoff timer, not fired synchronously.
    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#0`);

    act(() => jest.advanceTimersByTime(400));

    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#1`);
  });

  test('keeps retrying on a backoff and gives up after the cap', () => {
    const sourceUrl = 'https://cdn.7tv.app/emote/err/2x.avif';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      act(() => mockImageProps?.onError?.());
      act(() => jest.advanceTimersByTime(8000));
    }

    expect(evictMock).toHaveBeenCalledTimes(8);
    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#8`);

    act(() => mockImageProps?.onError?.());

    expect(evictMock).toHaveBeenCalledTimes(8);
    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#8`);
  });

  test('logs a forwarded warning once the retry budget is exhausted', () => {
    const sourceUrl = 'https://cdn.7tv.app/emote/err/2x.avif';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      act(() => mockImageProps?.onError?.());
      act(() => jest.advanceTimersByTime(8000));
    }

    expect(warnMock).not.toHaveBeenCalled();

    act(() => mockImageProps?.onError?.());

    expect(warnMock).toHaveBeenCalledTimes(1);
    expect(warnMock).toHaveBeenCalledWith('chat.emote.load_failed', {
      name: 'chat_resources_warning',
      error: undefined,
      url: sourceUrl,
      attempts: 8,
    });
  });

  test('a successful load resets the retry budget', () => {
    const sourceUrl = 'https://cdn.7tv.app/emote/err/2x.avif';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      act(() => mockImageProps?.onError?.());
      act(() => jest.advanceTimersByTime(8000));
    }
    expect(evictMock).toHaveBeenCalledTimes(4);

    act(() => mockImageProps?.onLoad?.());
    act(() => mockImageProps?.onError?.());

    expect(evictMock).toHaveBeenCalledTimes(5);
  });
});

describe('ChatInlineImage loading shimmer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows the shimmer while an uncached image loads and hides it once loaded', () => {
    mockSharedRef = null;
    const sourceUrl = 'https://cdn.7tv.app/emote/load/2x.avif';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    expect(screen.getByTestId('chat-image-shimmer')).toBeOnTheScreen();

    act(() => mockImageProps?.onLoad?.());

    expect(screen.queryByTestId('chat-image-shimmer')).not.toBeOnTheScreen();
  });

  test('a decoded shared ref renders immediately without a shimmer', () => {
    mockSharedRef = { isAnimated: false };
    render(
      <ChatInlineImage
        sourceUrl='https://cdn.7tv.app/emote/cached/2x.avif'
        style={{}}
      />,
    );

    expect(screen.queryByTestId('chat-image-shimmer')).not.toBeOnTheScreen();
  });
});
