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
  getCachedEmoteStats: jest.fn(() => ({ decoded: 0, inflight: 0, pinned: 0 })),
  getCachedEmoteByteEstimate: jest.fn(() => 0),
  getEmoteRefReleaseRaceCount: jest.fn(() => 0),
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

describe('ChatInlineImage fallback chain', () => {
  beforeEach(() => {
    mockSharedRef = null;
    mockImageProps = null;
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('walks to the alternate format then a smaller size on each 404, with no backoff delay', () => {
    const base = 'https://cdn.7tv.app/badge/01H85';
    render(<ChatInlineImage sourceUrl={`${base}/4x.webp`} style={{}} />);

    expect(mockImageProps?.recyclingKey).toEqual(`${base}/4x.webp#0`);

    // 4x.webp 404s -> swap format, same size, immediately.
    act(() => mockImageProps?.onError?.());
    expect(evictMock).toHaveBeenCalledWith(`${base}/4x.webp`);
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/4x.avif#0`);

    // 4x.avif 404s -> drop to the next size down.
    act(() => mockImageProps?.onError?.());
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/3x.webp#0`);

    // The fallback walk is immediate — nothing is waiting on a timer.
    act(() => jest.advanceTimersByTime(8000));
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/3x.webp#0`);
  });

  test('a successful load on a fallback variant stops the walk and renders it', () => {
    const base = 'https://cdn.7tv.app/badge/01H85';
    render(<ChatInlineImage sourceUrl={`${base}/4x.webp`} style={{}} />);

    act(() => mockImageProps?.onError?.());
    act(() => mockImageProps?.onError?.());
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/3x.webp#0`);

    act(() => mockImageProps?.onLoad?.());

    // No further fallback once a variant loads.
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/3x.webp#0`);
  });

  test('backoff-retries the smallest candidate once every format and size is exhausted', () => {
    const base = 'https://cdn.7tv.app/badge/01H85';
    render(<ChatInlineImage sourceUrl={`${base}/4x.webp`} style={{}} />);

    // 8 candidates: {4,3,2,1}x x {webp,avif}. 7 errors walk to the last one.
    for (let i = 0; i < 7; i += 1) {
      act(() => mockImageProps?.onError?.());
    }
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/1x.avif#0`);

    // Now on the smallest candidate, errors become backoff retries of it.
    act(() => mockImageProps?.onError?.());
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/1x.avif#0`);
    act(() => jest.advanceTimersByTime(400));
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/1x.avif#1`);
  });

  test('logs a forwarded warning only after the whole chain and the backoff budget are exhausted', () => {
    const base = 'https://cdn.7tv.app/badge/01H85';
    const sourceUrl = `${base}/4x.webp`;
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    // Walk the 7 fallback candidates.
    for (let i = 0; i < 7; i += 1) {
      act(() => mockImageProps?.onError?.());
    }
    // Then 8 backoff retries of the smallest candidate.
    for (let i = 0; i < 8; i += 1) {
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
      finalUrl: `${base}/1x.avif`,
      candidatesTried: 8,
      attempts: 8,
      renderPath: 'uri',
      tags: {
        emoteProvider: 'unknown',
        emoteScale: null,
        emoteKind: null,
        cacheDecoded: 0,
        cacheInflight: 0,
        cachePinned: 0,
        cacheBytes: 0,
        cacheReleaseRaces: 0,
      },
    });
  });

  test('a url with no derivable variants goes straight to backoff retries', () => {
    const sourceUrl =
      'https://static-cdn.jtvnw.net/emoticons/v2/x/default/dark/3.0';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    act(() => mockImageProps?.onError?.());
    expect(evictMock).toHaveBeenCalledWith(sourceUrl);
    // No fallback variant, so it stays on the same url and waits for the timer.
    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#0`);

    act(() => jest.advanceTimersByTime(400));
    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#1`);
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

describe('ChatInlineImage load watchdog', () => {
  beforeEach(() => {
    mockSharedRef = null;
    mockImageProps = null;
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('routes a silently-hung load (no onLoad or onError) through the error path', () => {
    const base = 'https://cdn.7tv.app/emote/watchdog';
    render(<ChatInlineImage sourceUrl={`${base}/4x.webp`} style={{}} />);

    expect(mockImageProps?.recyclingKey).toEqual(`${base}/4x.webp#0`);

    act(() => jest.advanceTimersByTime(12000));
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/4x.avif#0`);
  });

  test('a load that resolves before the watchdog fires cancels it', () => {
    const sourceUrl = 'https://cdn.7tv.app/emote/ok/2x.avif';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    act(() => mockImageProps?.onLoad?.());
    act(() => jest.advanceTimersByTime(12000));

    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#0`);
  });
});

describe('ChatInlineImage shared-ref recovery', () => {
  beforeEach(() => {
    mockSharedRef = null;
    mockImageProps = null;
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('snaps back to the shared ref once it decodes, abandoning the fallback walk', () => {
    const base = 'https://cdn.7tv.app/emote/01H85';
    const sourceUrl = `${base}/2x.webp`;
    const { rerender } = render(
      <ChatInlineImage sourceUrl={sourceUrl} style={{}} />,
    );

    // A transient error walks the row off the original url onto a fallback variant.
    act(() => mockImageProps?.onError?.());
    expect(mockImageProps?.recyclingKey).toEqual(`${base}/2x.avif#0`);

    // The shared ref finishes decoding — proof the original url is good — so the
    // row must abandon the walk and render the ref at index 0 again.
    mockSharedRef = { isAnimated: true };
    rerender(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    expect(mockImageProps?.recyclingKey).toEqual(`${sourceUrl}#0`);
  });

  test('one row erroring does not evict a healthy shared ref shown by other rows', () => {
    mockSharedRef = { isAnimated: true };
    const sourceUrl = 'https://cdn.7tv.app/emote/01H85/2x.webp';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    act(() => mockImageProps?.onError?.());

    expect(evictMock).not.toHaveBeenCalled();
  });
});
