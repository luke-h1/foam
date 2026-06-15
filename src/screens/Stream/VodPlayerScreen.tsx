import { IconButton } from '@app/components/IconButton/IconButton';
import { StreamPlayer } from '@app/components/StreamPlayer/StreamPlayer';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { theme } from '@app/styles/themes';
import { router, useFocusEffect } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { getLiveStreamLayoutMetrics } from './liveStreamLayout';

interface VodPlayerScreenProps {
  id: string;
}

// Hold the screen awake while watching so playback isn't interrupted by the
// idle-timer auto-lock — VODs are long-form, so this matters more than live.
const KEEP_AWAKE_TAG = 'vod-player';

export function VodPlayerScreen({ id }: VodPlayerScreenProps) {
  const { t } = useTranslation(['stream', 'common']);
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { isLandscape, layoutHeight, portraitTopInset, screenWidth } =
    getLiveStreamLayoutMetrics({
      insetTop: insets.top,
      windowHeight,
      windowWidth,
    });

  // In landscape the notch / Dynamic Island and home indicator sit on the left
  // and right edges, so reserve those insets rather than the top.
  const landscapeInsetLeft = isLandscape ? insets.left : 0;
  const landscapeInsetRight = isLandscape ? insets.right : 0;
  const videoWidth = Math.max(
    1,
    screenWidth - landscapeInsetLeft - landscapeInsetRight,
  );
  // Portrait pins a 16:9 video below the status-bar inset; landscape fills the
  // available height. Sizing the container to the video means the embedded
  // WebView is exactly video-sized and never letterboxes inside black bars.
  const videoHeight = isLandscape ? layoutHeight : videoWidth * (9 / 16);

  useEffect(() => {
    void ScreenOrientation.unlockAsync();
    return () => {
      void ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void activateKeepAwakeAsync(KEEP_AWAKE_TAG);
      return () => {
        void deactivateKeepAwake(KEEP_AWAKE_TAG);
      };
    }, []),
  );

  if (!id) {
    return (
      <EmptyState
        heading={t('vodNotFound')}
        content={t('vodNotFoundDescription')}
        button={t('common:close')}
        buttonOnPress={() => router.back()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style='light' />
      <View
        style={[
          styles.videoContainer,
          {
            width: videoWidth,
            height: videoHeight,
            left: landscapeInsetLeft,
            top: portraitTopInset,
          },
        ]}
      >
        <StreamPlayer
          video={id}
          parent='www.twitch.tv'
          autoplay
          muted={false}
          height='100%'
          width='100%'
        />
      </View>

      <View
        style={[
          styles.closeButtonWrap,
          {
            top: insets.top + theme.space12,
            right: theme.space16 + landscapeInsetRight,
          },
        ]}
      >
        <IconButton
          icon={{ type: 'symbol', name: 'xmark', size: 18 }}
          label={t('closeVod')}
          onPress={() => router.back()}
          size='2xl'
          style={styles.closeButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  closeButtonWrap: {
    flexDirection: 'row',
    gap: theme.space12,
    position: 'absolute',
    zIndex: 2,
  },
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  videoContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 1,
  },
});
