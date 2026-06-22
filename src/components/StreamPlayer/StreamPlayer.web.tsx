import { type Ref,useImperativeHandle } from 'react';
import { type DimensionValue,Linking, StyleSheet, View } from 'react-native';

import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { theme } from '@app/styles/themes';

export interface StreamPlayerRef {
  forceRefresh: () => void;
  getChannel: () => string | undefined;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
  getMuted: () => boolean;
  getPaused: () => boolean;
  getVolume: () => number;
  mute: () => void;
  pause: () => void;
  play: () => void;
  seek: (timestamp: number) => void;
  setChannel: (channel: string) => void;
  setMuted: (muted: boolean) => void;
  setQuality: (quality: string) => void;
  setVideo: (videoId: string, timestamp?: number) => void;
  setVolume: (volume: number) => void;
  unmute: () => void;
}

export interface StreamInfo {
  gameName?: string;
  profileImageUrl?: string;
  startedAt?: string;
  title?: string;
  userName?: string;
  userLogin?: string;
  viewerCount?: number;
}

export interface StreamPlayerProps {
  autoplay?: boolean;
  channel?: string;
  clip?: string;
  deferOverlayUntilUserUnmute?: boolean;
  height?: DimensionValue;
  muted?: boolean;
  onBackPress?: () => void;
  onContentGateChange?: (hasGate: boolean) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onOffline?: () => void;
  onOnline?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  onReady?: () => void;
  onRefresh?: () => void;
  onSharePress?: () => void;
  onVideoAreaPress?: () => void;
  onVideoAreaSwipeDown?: () => void;
  onWebViewLoaded?: () => void;
  parent?: string;
  showOverlayControls?: boolean;
  streamInfo?: StreamInfo;
  video?: string;
  width?: DimensionValue;
  ref?: Ref<StreamPlayerRef>;
}

function getEmbedParent(parent?: string): string {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }

  return parent ?? 'foam-app.com';
}

function buildTwitchPlayerUrl({
  autoplay,
  channel,
  clip,
  muted,
  parent,
  video,
}: {
  autoplay: boolean;
  channel?: string;
  clip?: string;
  muted: boolean;
  parent: string;
  video?: string;
}) {
  if (clip) {
    const params = new URLSearchParams({
      clip,
      parent,
      autoplay: autoplay ? 'true' : 'false',
      muted: muted ? 'true' : 'false',
      preload: 'metadata',
    });

    return `https://clips.twitch.tv/embed?${params.toString()}`;
  }

  const params = new URLSearchParams({
    autoplay: autoplay ? 'true' : 'false',
    muted: muted ? 'true' : 'false',
    parent,
  });

  if (video) {
    params.set('video', video);
  } else {
    params.set('channel', channel || 'twitch');
  }

  return `https://player.twitch.tv/?${params.toString()}`;
}

export function StreamPlayer({
  autoplay = true,
  channel,
  clip,
  height,
  muted = false,
  onReady,
  onRefresh,
  onWebViewLoaded,
  parent,
  video,
  width,
  ref,
}: StreamPlayerProps) {
  const embedParent = getEmbedParent(parent);
  const playerUrl = buildTwitchPlayerUrl({
    autoplay,
    channel,
    clip,
    muted,
    parent: embedParent,
    video,
  });

  useImperativeHandle(
    ref,
    () => ({
      forceRefresh: () => onRefresh?.(),
      getChannel: () => channel,
      getCurrentTime: async () => 0,
      getDuration: async () => 0,
      getMuted: () => muted,
      getPaused: () => false,
      getVolume: () => (muted ? 0 : 1),
      mute: () => undefined,
      pause: () => undefined,
      play: () => undefined,
      seek: () => undefined,
      setChannel: () => undefined,
      setMuted: () => undefined,
      setQuality: () => undefined,
      setVideo: () => undefined,
      setVolume: () => undefined,
      unmute: () => undefined,
    }),
    [channel, muted, onRefresh],
  );

  const playerWidth = width ?? '100%';
  const playerHeight = height ?? '100%';

  return (
    <View
      style={[styles.container, { width: playerWidth, height: playerHeight }]}
    >
      <iframe
        title={i18next.t('stream:twitchVideoPlayer')}
        sandbox='allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation'
        allow='autoplay; encrypted-media; fullscreen; picture-in-picture'
        allowFullScreen
        onLoad={() => {
          onReady?.();
          onWebViewLoaded?.();
        }}
        src={playerUrl}
        style={styles.iframe}
      />
      {!clip && (
        <View style={styles.footer}>
          <Text color='gray.contrast' type='xs' numberOfLines={1}>
            {channel ?? 'Twitch'} on Twitch
          </Text>
          <Button
            onPress={() => {
              void Linking.openURL(
                video
                  ? `https://www.twitch.tv/videos/${video}`
                  : `https://www.twitch.tv/${channel ?? ''}`,
              );
            }}
            style={styles.openButton}
          >
            <Text color='gray.contrast' type='xs' weight='semibold'>
              Open
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  footer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.74)',
    bottom: 0,
    flexDirection: 'row',
    gap: theme.space8,
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
    position: 'absolute',
    right: 0,
  },
  iframe: {
    borderWidth: 0,
    height: '100%',
    width: '100%',
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: theme.borderRadius12,
    justifyContent: 'center',
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
});
