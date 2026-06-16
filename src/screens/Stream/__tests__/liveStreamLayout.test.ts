jest.mock('@app/components/Chat/Chat', () => ({
  Chat: () => null,
}));

jest.mock(
  '@app/components/ChannelPredictionCard/ChannelPredictionCard',
  () => ({
    ChannelPredictionCard: () => null,
  }),
);

jest.mock('@app/components/ChannelPollCard/ChannelPollCard', () => ({
  ChannelPollCard: () => null,
}));

jest.mock('@app/components/StreamPlayer/StreamPlayer', () => ({
  StreamPlayer: () => null,
}));

jest.mock('@app/hooks/useChannelPrediction', () => ({
  useChannelPrediction: () => ({ prediction: null }),
}));

jest.mock('@app/hooks/useChannelPoll', () => ({
  useChannelPoll: () => ({ poll: null }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
}));

jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(),
  unlockAsync: jest.fn(),
  OrientationLock: {
    PORTRAIT_UP: 1,
  },
}));

import {
  clampLandscapeChatWidth,
  getDefaultLandscapeChatWidth,
  getLiveStreamChatLeft,
  getLiveStreamLayoutMetrics,
  getLiveStreamChatDimensions,
  getLiveStreamVideoDimensions,
  getNextChatCycleAction,
} from '../liveStreamLayout';

describe('liveStreamLayout', () => {
  test('uses actual window dimensions for landscape absolute layout', () => {
    expect(
      getLiveStreamLayoutMetrics({
        insetTop: 44,
        windowHeight: 430,
        windowWidth: 932,
      }),
    ).toEqual({
      isLandscape: true,
      layoutHeight: 430,
      portraitTopInset: 0,
      screenHeight: 430,
      screenWidth: 932,
    });
  });

  test('subtracts the top safe inset only in portrait', () => {
    expect(
      getLiveStreamLayoutMetrics({
        insetTop: 44,
        windowHeight: 932,
        windowWidth: 430,
      }),
    ).toEqual({
      isLandscape: false,
      layoutHeight: 888,
      portraitTopInset: 44,
      screenHeight: 932,
      screenWidth: 430,
    });
  });

  test('positions landscape chat against the right edge', () => {
    expect(
      getLiveStreamChatLeft({
        chatWidth: 320,
        isLandscape: true,
        screenWidth: 932,
      }),
    ).toBe(612);
  });

  test('keeps portrait chat aligned to the left edge', () => {
    expect(
      getLiveStreamChatLeft({
        chatWidth: 430,
        isLandscape: false,
        screenWidth: 430,
      }),
    ).toBe(0);
  });

  test('clamps sidebar chat width to the landscape bounds', () => {
    expect(clampLandscapeChatWidth(120, 1000, 'sidebar')).toBe(200);
    expect(clampLandscapeChatWidth(900, 1000, 'sidebar')).toBe(550);
    expect(clampLandscapeChatWidth(420, 1000, 'sidebar')).toBe(420);
  });

  test('keeps a user-chosen width narrower than the default on a phone', () => {
    const screenWidth = 780;
    const defaultWidth = getDefaultLandscapeChatWidth('sidebar', screenWidth);
    const narrowed = clampLandscapeChatWidth(230, screenWidth, 'sidebar');

    expect(narrowed).toBe(230);
    expect(narrowed).toBeLessThan(defaultWidth);
  });

  test('allows a wider overlay chat than sidebar chat', () => {
    expect(clampLandscapeChatWidth(800, 1000, 'overlay')).toBe(680);
    expect(clampLandscapeChatWidth(800, 1000, 'sidebar')).toBe(550);
  });

  test('uses mode-specific default landscape chat widths', () => {
    expect(getDefaultLandscapeChatWidth('overlay', 1000)).toBe(380);
    expect(getDefaultLandscapeChatWidth('overlay', 600)).toBe(276);
    expect(getDefaultLandscapeChatWidth('sidebar', 1000)).toBe(350);
  });

  test('cycles chat visibility through sidebar, overlay, and hidden states', () => {
    expect(getNextChatCycleAction(false, 'sidebar')).toBe('show');
    expect(getNextChatCycleAction(true, 'sidebar')).toBe('overlay');
    expect(getNextChatCycleAction(true, 'overlay')).toBe('hide');
  });

  test('sizes landscape video around visible sidebar chat', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'sidebar',
        isChatEnabled: true,
        isChatVisible: true,
        isLandscape: true,
        landscapeChatWidth: 320,
        layoutHeight: 500,
        isStreamEnabled: true,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 680, height: 500 });
  });

  test('uses full video width for hidden or overlay landscape chat', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'overlay',
        isChatEnabled: true,
        isChatVisible: true,
        isLandscape: true,
        landscapeChatWidth: 320,
        layoutHeight: 500,
        isStreamEnabled: true,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 1000, height: 500 });
  });

  test('keeps portrait video 16:9 when a content gate is visible', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'sidebar',
        isChatEnabled: true,
        isChatVisible: true,
        isLandscape: false,
        landscapeChatWidth: null,
        layoutHeight: 700,
        isStreamEnabled: true,
        screenWidth: 400,
      }),
    ).toEqual({ width: 400, height: 225 });
  });

  test('sizes portrait chat below the 16:9 video', () => {
    const video = getLiveStreamVideoDimensions({
      fullscreenChatMode: 'sidebar',
      isChatEnabled: true,
      isChatVisible: true,
      isLandscape: false,
      landscapeChatWidth: null,
      layoutHeight: 700,
      isStreamEnabled: true,
      screenWidth: 400,
    });
    const chat = getLiveStreamChatDimensions({
      fullscreenChatMode: 'sidebar',
      isChatEnabled: true,
      isLandscape: false,
      landscapeChatWidth: null,
      layoutHeight: 700,
      isStreamEnabled: true,
      screenWidth: 400,
    });

    expect(video.height + chat.height).toBe(700);
    expect(chat).toEqual({ width: 400, height: 475 });
  });

  test('clamps landscape chat dimensions by mode', () => {
    const video = getLiveStreamVideoDimensions({
      fullscreenChatMode: 'sidebar',
      isChatEnabled: true,
      isChatVisible: true,
      isLandscape: true,
      landscapeChatWidth: 320,
      layoutHeight: 500,
      isStreamEnabled: true,
      screenWidth: 1000,
    });
    const chat = getLiveStreamChatDimensions({
      fullscreenChatMode: 'sidebar',
      isChatEnabled: true,
      isLandscape: true,
      landscapeChatWidth: 320,
      layoutHeight: 500,
      isStreamEnabled: true,
      screenWidth: 1000,
    });

    expect(video.width + chat.width).toBe(1000);
    expect(
      getLiveStreamChatDimensions({
        fullscreenChatMode: 'overlay',
        isChatEnabled: true,
        isLandscape: true,
        landscapeChatWidth: 900,
        layoutHeight: 500,
        isStreamEnabled: true,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 680, height: 500 });
  });

  test('expands chat to fill the screen when the stream is disabled', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'sidebar',
        isChatEnabled: true,
        isChatVisible: true,
        isLandscape: false,
        landscapeChatWidth: null,
        layoutHeight: 700,
        isStreamEnabled: false,
        screenWidth: 400,
      }),
    ).toEqual({ width: 0, height: 0 });

    expect(
      getLiveStreamChatDimensions({
        fullscreenChatMode: 'sidebar',
        isChatEnabled: true,
        isLandscape: false,
        landscapeChatWidth: null,
        layoutHeight: 700,
        isStreamEnabled: false,
        screenWidth: 400,
      }),
    ).toEqual({ width: 400, height: 700 });
  });

  test('keeps landscape video full-screen and collapses chat when chat is disabled', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'sidebar',
        isChatEnabled: false,
        isChatVisible: true,
        isLandscape: true,
        landscapeChatWidth: 320,
        layoutHeight: 500,
        isStreamEnabled: true,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 1000, height: 500 });

    expect(
      getLiveStreamChatDimensions({
        fullscreenChatMode: 'sidebar',
        isChatEnabled: false,
        isLandscape: true,
        landscapeChatWidth: 320,
        layoutHeight: 500,
        isStreamEnabled: true,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 0, height: 0 });
  });

  test('keeps portrait video 16:9 when chat is disabled', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'sidebar',
        isChatEnabled: false,
        isChatVisible: true,
        isLandscape: false,
        landscapeChatWidth: null,
        layoutHeight: 700,
        isStreamEnabled: true,
        screenWidth: 400,
      }),
    ).toEqual({ width: 400, height: 225 });
  });
});
