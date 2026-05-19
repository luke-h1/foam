jest.mock('@app/components/Chat/Chat', () => ({
  Chat: () => null,
}));

jest.mock('@app/components/ChannelPredictionCard/ChannelPredictionCard', () => ({
  ChannelPredictionCard: () => null,
}));

jest.mock('@app/components/ChannelPollCard/ChannelPollCard', () => ({
  ChannelPollCard: () => null,
}));

jest.mock('@app/components/StreamPlayer/StreamPlayer', () => ({
  StreamPlayer: () => null,
  StreamPlayerPrewarm: () => null,
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
  getLiveStreamChatDimensions,
  getLiveStreamVideoDimensions,
  getNextChatCycleAction,
} from '../LiveStreamScreen';

describe('LiveStreamScreen layout helpers', () => {
  test('clamps sidebar chat width to the landscape bounds', () => {
    expect(clampLandscapeChatWidth(120, 1000, 'sidebar')).toBe(280);
    expect(clampLandscapeChatWidth(900, 1000, 'sidebar')).toBe(550);
    expect(clampLandscapeChatWidth(420, 1000, 'sidebar')).toBe(420);
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
        hasContentGate: false,
        isChatVisible: true,
        isLandscape: true,
        landscapeChatWidth: 320,
        layoutHeight: 500,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 680, height: 500 });
  });

  test('uses full video width for hidden or overlay landscape chat', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'overlay',
        hasContentGate: false,
        isChatVisible: true,
        isLandscape: true,
        landscapeChatWidth: 320,
        layoutHeight: 500,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 1000, height: 500 });
  });

  test('expands portrait video when a content gate is visible', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'sidebar',
        hasContentGate: true,
        isChatVisible: true,
        isLandscape: false,
        landscapeChatWidth: null,
        layoutHeight: 700,
        screenWidth: 400,
      }),
    ).toEqual({ width: 400, height: 700 });
  });

  test('sizes portrait chat below the 16:9 video', () => {
    expect(
      getLiveStreamChatDimensions({
        fullscreenChatMode: 'sidebar',
        hasContentGate: false,
        isLandscape: false,
        landscapeChatWidth: null,
        layoutHeight: 700,
        screenWidth: 400,
      }),
    ).toEqual({ width: 400, height: 475 });
  });

  test('clamps landscape chat dimensions by mode', () => {
    expect(
      getLiveStreamChatDimensions({
        fullscreenChatMode: 'overlay',
        hasContentGate: false,
        isLandscape: true,
        landscapeChatWidth: 900,
        layoutHeight: 500,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 680, height: 500 });
  });
});
