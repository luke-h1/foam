import { getLiveStreamVideoDimensions } from '../getLiveStreamVideoDimensions';

describe('getLiveStreamVideoDimensions', () => {
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

  test.each([
    { fullscreenChatMode: 'overlay' as const, isChatVisible: true },
    { fullscreenChatMode: 'sidebar' as const, isChatVisible: false },
  ])(
    'uses full video width for landscape chat in $fullscreenChatMode mode when visible is $isChatVisible',
    ({ fullscreenChatMode, isChatVisible }) => {
      expect(
        getLiveStreamVideoDimensions({
          fullscreenChatMode,
          isChatEnabled: true,
          isChatVisible,
          isLandscape: true,
          landscapeChatWidth: 320,
          layoutHeight: 500,
          isStreamEnabled: true,
          screenWidth: 1000,
        }),
      ).toEqual({ width: 1000, height: 500 });
    },
  );

  test('keeps portrait video 16:9 of the screen width', () => {
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

  test('gives no space to the video when the stream is disabled', () => {
    expect(
      getLiveStreamVideoDimensions({
        fullscreenChatMode: 'sidebar',
        isChatEnabled: true,
        isChatVisible: true,
        isLandscape: true,
        landscapeChatWidth: 320,
        layoutHeight: 500,
        isStreamEnabled: false,
        screenWidth: 1000,
      }),
    ).toEqual({ width: 0, height: 0 });
  });
});
