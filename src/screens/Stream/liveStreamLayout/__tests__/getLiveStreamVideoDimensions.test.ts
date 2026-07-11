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
