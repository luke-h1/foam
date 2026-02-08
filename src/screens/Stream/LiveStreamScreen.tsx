import { Chat } from '@app/components/Chat/Chat';
import {
  NativeStreamPlayer,
  type NativeStreamPlayerRef,
} from '@app/components/NativeStreamPlayer/NativeStreamPlayer';
import { Spinner } from '@app/components/Spinner/Spinner';
import {
  StreamPlayer,
  type StreamPlayerRef,
} from '@app/components/StreamPlayer/StreamPlayer';

import { StreamStackScreenProps } from '@app/navigators/StreamStackNavigator';
import { twitchQueries } from '@app/queries/twitchQueries';
import { storageService } from '@app/services/storage-service';
import { useQueries } from '@tanstack/react-query';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

export const LiveStreamScreen: FC<StreamStackScreenProps<'LiveStream'>> = ({
  route: { params },
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const isHlsEnabled = storageService.getString<boolean>('foam_hls_player');

  const [isChatVisible] = useState<boolean>(true);
  const [shouldRenderChat, setShouldRenderChat] = useState<boolean>(false);
  const streamPlayerRef = useRef<StreamPlayerRef>(null);
  const nativePlayerRef = useRef<NativeStreamPlayerRef>(null);

  useEffect(() => {
    setShouldRenderChat(false);
    return () => {
      console.log('🚪 LiveStreamScreen unmounting, forcing fast cleanup...');
      setShouldRenderChat(false);
    };
  }, [params.id]);

  const [streamQueryResult] = useQueries({
    queries: [twitchQueries.getStream(params.id)],
  });

  const { data: stream, isPending: isStreamPending } = streamQueryResult;

  useEffect(() => {
    if (stream?.user_login && stream?.user_id && !shouldRenderChat) {
      // Use setTimeout to defer Chat rendering to next tick, allowing screen to render first to stop blocking navigation
      const timer = setTimeout(() => {
        setShouldRenderChat(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [stream?.user_login, stream?.user_id, shouldRenderChat]);

  const getVideoDimensions = useCallback(() => {
    if (isLandscape) {
      return {
        width: isChatVisible ? screenWidth * 0.6 : screenWidth,
        height: screenHeight,
      };
    }
    return {
      width: screenWidth,
      height: screenWidth * (9 / 16),
    };
  }, [isLandscape, isChatVisible, screenWidth, screenHeight]);

  const getChatDimensions = useCallback(() => {
    if (isLandscape) {
      return {
        width: screenWidth * 0.65,
        height: screenHeight,
      };
    }
    const videoHeight = screenWidth * (9 / 16);
    return {
      width: screenWidth,
      height: screenHeight - videoHeight,
    };
  }, [isLandscape, screenWidth, screenHeight]);

  const videoWidth = useSharedValue(getVideoDimensions().width);
  const videoHeight = useSharedValue(getVideoDimensions().height);
  const chatWidth = useSharedValue(getChatDimensions().width);
  const chatHeight = useSharedValue(getChatDimensions().height);
  const chatOpacity = useSharedValue(1);
  const chatTranslateX = useSharedValue(0);

  const animatedChatStyle = useAnimatedStyle(() => ({
    width: chatWidth.value,
    height: chatHeight.value,
    opacity: chatOpacity.value,
    transform: [{ translateX: chatTranslateX.value }],
  }));

  useEffect(() => {
    const videoDims = getVideoDimensions();
    const chatDims = getChatDimensions();

    videoWidth.value = withTiming(videoDims.width, { duration: 300 });
    videoHeight.value = withTiming(videoDims.height, { duration: 300 });
    chatWidth.value = withTiming(chatDims.width, { duration: 300 });
    chatHeight.value = withTiming(chatDims.height, { duration: 300 });

    if (isChatVisible) {
      chatOpacity.value = withTiming(1, { duration: 300 });
      chatTranslateX.value = withTiming(0, { duration: 300 });
    } else {
      chatOpacity.value = withTiming(0, { duration: 300 });
      if (isLandscape) {
        chatTranslateX.value = withTiming(chatDims.width, { duration: 300 });
      }
    }
  }, [
    isLandscape,
    isChatVisible,
    screenWidth,
    screenHeight,
    videoWidth,
    videoHeight,
    chatWidth,
    chatHeight,
    chatOpacity,
    chatTranslateX,
    getVideoDimensions,
    getChatDimensions,
  ]);

  const animatedVideoStyle = useAnimatedStyle(() => ({
    width: videoWidth.value,
    height: videoHeight.value,
  }));

  if (isStreamPending) {
    return <Spinner />;
  }

  return (
    <View style={[styles.contentContainer, isLandscape && styles.row]}>
      <Animated.View style={[styles.videoContainer, animatedVideoStyle]}>
        {stream?.user_login &&
          (isHlsEnabled ? (
            <NativeStreamPlayer
              ref={nativePlayerRef}
              channel={stream.user_login}
              height="100%"
              width="100%"
              autoplay
              streamInfo={{
                userName: stream.user_name,
                userLogin: stream.user_login,
                viewerCount: stream.viewer_count,
                startedAt: stream.started_at,
                gameName: stream.game_name,
              }}
            />
          ) : (
            <StreamPlayer
              ref={streamPlayerRef}
              channel={stream.user_login}
              height="100%"
              width="100%"
              autoplay
            />
          ))}
      </Animated.View>

      <Animated.View style={[styles.chatContainer, animatedChatStyle]}>
        {shouldRenderChat && stream?.user_login && stream.user_id && (
          <View style={styles.chatContent}>
            <Chat channelId={stream.user_id} channelName={stream.user_login} />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  videoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  videoUser: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    marginTop: 20,
  },
  chatContainer: {
    overflow: 'hidden',
  },
  chatContent: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
}));
