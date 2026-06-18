import { render, act } from '@testing-library/react-native';
import { evictCachedEmoteRef } from '@app/Providers/CachedEmotesProvider/cache-service';
import {
  createRowVisibilityStore,
  RowVisibilityContext,
} from '../../rowVisibility';
import { ChatInlineImage } from '../ChatInlineImage';

const mockStartAnimating = jest.fn();
const mockStopAnimating = jest.fn();

let mockImageProps: { onError?: () => void; recyclingKey?: string } | null =
  null;

jest.mock('expo-image', () => {
  const ReactModule = require('react');
  return {
    Image: ReactModule.forwardRef(
      (
        props: { onError?: () => void; recyclingKey?: string },
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

const evictMock = jest.mocked(evictCachedEmoteRef);

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
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('evicts the cached ref and remounts with a new recyclingKey on error', () => {
    const sourceUrl = 'https://cdn.7tv.app/emote/err/2x.avif';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    expect(mockImageProps?.recyclingKey).toBe(`${sourceUrl}#0`);

    act(() => mockImageProps?.onError?.());

    expect(evictMock).toHaveBeenCalledTimes(1);
    expect(evictMock).toHaveBeenCalledWith(sourceUrl);
    expect(mockImageProps?.recyclingKey).toBe(`${sourceUrl}#1`);
  });

  test('stops retrying after the cap of 2 attempts', () => {
    const sourceUrl = 'https://cdn.7tv.app/emote/err/2x.avif';
    render(<ChatInlineImage sourceUrl={sourceUrl} style={{}} />);

    act(() => mockImageProps?.onError?.());
    act(() => mockImageProps?.onError?.());
    expect(evictMock).toHaveBeenCalledTimes(2);
    expect(mockImageProps?.recyclingKey).toBe(`${sourceUrl}#2`);

    act(() => mockImageProps?.onError?.());

    expect(evictMock).toHaveBeenCalledTimes(2);
    expect(mockImageProps?.recyclingKey).toBe(`${sourceUrl}#2`);
  });
});
