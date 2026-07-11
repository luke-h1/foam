import { getLiveStreamChatDimensions } from '../getLiveStreamChatDimensions';
import { getLiveStreamVideoDimensions } from '../getLiveStreamVideoDimensions';

describe('getLiveStreamChatDimensions', () => {
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
});
