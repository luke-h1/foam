import { type RefObject, useLayoutEffect, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { markSignpost } from '@app/lib/signpost';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';

import type { FullscreenChatMode } from '../types';
import { getLandscapeChatWidthBounds } from '../util/getLandscapeChatWidthBounds';

const LANDSCAPE_CHAT_RESIZE_ACTIVATION_DISTANCE = 6;
const LANDSCAPE_CHAT_RESIZE_FAIL_DISTANCE = 12;
const LANDSCAPE_CHAT_DIVIDER_RESTING_OPACITY = 0.55;
const LANDSCAPE_CHAT_CLOSE_WIDTH_FRACTION = 0.55;
const LANDSCAPE_CHAT_CLOSE_VELOCITY = 900;

const RESIZE_LAYOUT_STEP_PX = 32;

const CHAT_REVEAL_ANIMATION_CONFIG: WithSpringConfig = {
  ...motion.spring.responsive,
  overshootClamping: true,
};

type Dimensions = { width: number; height: number };

interface UseLiveStreamAnimatedLayoutOptions {
  chatDimensions: Dimensions;
  closeLandscapeChatBySwipe: () => void;
  commitLandscapeChatWidth: (width: number) => void;
  contentWidth: number;
  effectiveChatHeight: number;
  effectiveChatWidth: number;
  fullscreenChatMode: FullscreenChatMode;
  isChatVisibleForLayout: boolean;
  isLandscape: boolean;
  isLandscapeChatHidden: boolean;
  landscapeInsetLeft: number;
  landscapeInsetRight: number;
  portraitTopInset: number;
  previousIsLandscapeRef: RefObject<boolean>;
  videoDimensions: Dimensions;
}

/**
 * Owns the animated layer: the shared values the styles read, the layout sync
 * that updates them atomically on rotation, and the landscape resize gesture.
 * Layout inputs are mirrored as shared values because reading JS values from a
 * worklet caused a one-frame flicker on rotation.
 */
export function useLiveStreamAnimatedLayout({
  chatDimensions,
  closeLandscapeChatBySwipe,
  commitLandscapeChatWidth,
  contentWidth,
  effectiveChatHeight,
  effectiveChatWidth,
  fullscreenChatMode,
  isChatVisibleForLayout,
  isLandscape,
  isLandscapeChatHidden,
  landscapeInsetLeft,
  landscapeInsetRight,
  portraitTopInset,
  previousIsLandscapeRef,
  videoDimensions,
}: UseLiveStreamAnimatedLayoutOptions) {
  const videoWidth = useSharedValue(videoDimensions.width);
  const videoHeight = useSharedValue(videoDimensions.height);
  const chatWidth = useSharedValue(effectiveChatWidth);
  const chatHeight = useSharedValue(effectiveChatHeight);
  const chatHidden = useSharedValue(isLandscapeChatHidden ? 1 : 0);
  const chatOpacity = useSharedValue(1);
  const chatTranslateX = useSharedValue(0);
  const resizeStartWidth = useSharedValue(0);
  const lastAppliedChatWidth = useSharedValue(0);

  const resizeHandleOpacity = useSharedValue(
    LANDSCAPE_CHAT_DIVIDER_RESTING_OPACITY,
  );

  const landscapeSV = useSharedValue(isLandscape ? 1 : 0);

  const insetLeftSV = useSharedValue(landscapeInsetLeft);
  const topInsetSV = useSharedValue(portraitTopInset);
  const contentWidthSV = useSharedValue(contentWidth);

  const animatedChatStyle = useAnimatedStyle(() => ({
    height: chatHeight.get(),
    left:
      landscapeSV.get() > 0.5
        ? insetLeftSV.get() +
          Math.max(0, contentWidthSV.get() - chatWidth.get())
        : 0,
    opacity: chatOpacity.get(),
    top: landscapeSV.get() > 0.5 ? 0 : topInsetSV.get() + videoHeight.get(),
    transform: [{ translateX: chatTranslateX.get() }],
    width: chatWidth.get(),
  }));

  useLayoutEffect(() => {
    const orientationChanged = previousIsLandscapeRef.current !== isLandscape;

    previousIsLandscapeRef.current = isLandscape;

    // Snap position inputs in the same pass as the dimensions to avoid a rotation flicker.
    landscapeSV.set(isLandscape ? 1 : 0);

    insetLeftSV.set(landscapeInsetLeft);
    topInsetSV.set(portraitTopInset);
    contentWidthSV.set(contentWidth);

    if (orientationChanged) {
      markSignpost('live-stream.orientation-change');
      cancelAnimation(videoWidth);
      cancelAnimation(videoHeight);
      cancelAnimation(chatWidth);
      cancelAnimation(chatHeight);
      cancelAnimation(chatOpacity);
      cancelAnimation(chatTranslateX);

      videoWidth.set(videoDimensions.width);
      videoHeight.set(videoDimensions.height);
      chatWidth.set(effectiveChatWidth);
      chatHeight.set(effectiveChatHeight);

      // Snap chat into place on rotation with no reveal. A fade here makes rapid rotation slow.
      chatOpacity.set(isLandscapeChatHidden ? 0 : 1);

      chatTranslateX.set(
        isLandscapeChatHidden && isLandscape ? chatDimensions.width : 0,
      );
      chatHidden.set(isLandscapeChatHidden ? 1 : 0);

      return;
    }

    const layoutSignpost = isLandscapeChatHidden
      ? 'live-stream.chat-hide'
      : 'live-stream.chat-reveal';

    markSignpost(layoutSignpost);
    chatHidden.set(
      withSpring(isLandscapeChatHidden ? 1 : 0, CHAT_REVEAL_ANIMATION_CONFIG),
    );
    videoWidth.set(videoDimensions.width);
    videoHeight.set(videoDimensions.height);
    chatWidth.set(
      isLandscapeChatHidden ? chatDimensions.width : effectiveChatWidth,
    );
    chatHeight.set(
      isLandscapeChatHidden ? chatDimensions.height : effectiveChatHeight,
    );

    if (!isLandscapeChatHidden) {
      chatOpacity.set(withSpring(1, CHAT_REVEAL_ANIMATION_CONFIG));
      chatTranslateX.set(withSpring(0, CHAT_REVEAL_ANIMATION_CONFIG));
      return;
    }

    chatOpacity.set(withSpring(0, CHAT_REVEAL_ANIMATION_CONFIG));

    chatTranslateX.set(
      withSpring(
        isLandscape ? chatDimensions.width : 0,
        CHAT_REVEAL_ANIMATION_CONFIG,
      ),
    );
  }, [
    isLandscape,
    isLandscapeChatHidden,
    landscapeInsetLeft,
    portraitTopInset,
    previousIsLandscapeRef,
    contentWidth,
    videoDimensions,
    chatDimensions,
    effectiveChatWidth,
    effectiveChatHeight,
    videoWidth,
    videoHeight,
    chatWidth,
    chatHeight,
    chatOpacity,
    chatTranslateX,
    chatHidden,
    landscapeSV,
    insetLeftSV,
    topInsetSV,
    contentWidthSV,
  ]);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    height: videoHeight.get(),
    left: insetLeftSV.get(),
    top: topInsetSV.get(),
    width: videoWidth.get(),
  }));

  // Hidden chat keeps its width so the panel can slide off. Controls follow
  // the hidden flag and sit on the screen edge.
  const animatedFullscreenControlsStyle = useAnimatedStyle(() => ({
    right:
      theme.space16 +
      landscapeInsetRight +
      chatWidth.get() * (1 - chatHidden.get()),
  }));

  const animatedResizeHandleStyle = useAnimatedStyle(() => ({
    opacity: resizeHandleOpacity.get(),
  }));

  const resizeChatGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([
          -LANDSCAPE_CHAT_RESIZE_ACTIVATION_DISTANCE,
          LANDSCAPE_CHAT_RESIZE_ACTIVATION_DISTANCE,
        ])
        .failOffsetY([
          -LANDSCAPE_CHAT_RESIZE_FAIL_DISTANCE,
          LANDSCAPE_CHAT_RESIZE_FAIL_DISTANCE,
        ])
        .onBegin(() => {
          const startWidth = chatWidth.get();
          resizeStartWidth.set(startWidth);
          lastAppliedChatWidth.set(startWidth);
          resizeHandleOpacity.set(1);
        })
        .onUpdate(event => {
          const { maxWidth } = getLandscapeChatWidthBounds(
            contentWidth,
            fullscreenChatMode,
          );

          const nextWidth = Math.min(
            maxWidth,
            Math.max(0, resizeStartWidth.get() - event.translationX),
          );

          if (
            Math.abs(nextWidth - lastAppliedChatWidth.get()) <
            RESIZE_LAYOUT_STEP_PX
          ) {
            return;
          }

          lastAppliedChatWidth.set(nextWidth);
          chatWidth.set(nextWidth);

          if (fullscreenChatMode === 'sidebar' && isChatVisibleForLayout) {
            videoWidth.set(Math.max(1, contentWidth - nextWidth));
          }
        })
        .onEnd(event => {
          const { minWidth, maxWidth } = getLandscapeChatWidthBounds(
            contentWidth,
            fullscreenChatMode,
          );

          const width = Math.min(
            maxWidth,
            Math.max(0, resizeStartWidth.get() - event.translationX),
          );

          if (
            width < minWidth * LANDSCAPE_CHAT_CLOSE_WIDTH_FRACTION ||
            event.velocityX > LANDSCAPE_CHAT_CLOSE_VELOCITY
          ) {
            scheduleOnRN(closeLandscapeChatBySwipe);
            return;
          }

          const committedWidth = Math.max(minWidth, width);
          chatWidth.set(committedWidth);

          if (fullscreenChatMode === 'sidebar' && isChatVisibleForLayout) {
            videoWidth.set(Math.max(1, contentWidth - committedWidth));
          }

          scheduleOnRN(commitLandscapeChatWidth, committedWidth);
        })
        .onFinalize(() => {
          resizeHandleOpacity.set(LANDSCAPE_CHAT_DIVIDER_RESTING_OPACITY);
        }),
    [
      fullscreenChatMode,
      contentWidth,
      isChatVisibleForLayout,
      closeLandscapeChatBySwipe,
      commitLandscapeChatWidth,
      chatWidth,
      videoWidth,
      resizeStartWidth,
      lastAppliedChatWidth,
      resizeHandleOpacity,
    ],
  );

  return {
    animatedChatStyle,
    animatedFullscreenControlsStyle,
    animatedResizeHandleStyle,
    animatedVideoStyle,
    resizeChatGesture,
  };
}
