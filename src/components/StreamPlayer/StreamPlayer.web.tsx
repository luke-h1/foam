import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { Linking, StyleSheet, View, type DimensionValue } from 'react-native';

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
  onVideoAreaPress?: () => void;
  onVideoAreaSwipeDown?: () => void;
  onWebViewLoaded?: () => void;
  parent?: string;
  restrictWebViewNavigationToTwitchPlayer?: boolean;
  showOverlayControls?: boolean;
  streamInfo?: StreamInfo;
  streamProxyBaseUrl?: string;
  useRawTwitchPlayer?: boolean;
  video?: string;
  width?: DimensionValue;
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
  muted,
  parent,
  video,
}: {
  autoplay: boolean;
  channel?: string;
  muted: boolean;
  parent: string;
  video?: string;
}) {
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

export const StreamPlayer = forwardRef<StreamPlayerRef, StreamPlayerProps>(
  function StreamPlayer(
    {
      autoplay = true,
      channel,
      height,
      muted = false,
      onReady,
      onRefresh,
      onWebViewLoaded,
      parent,
      video,
      width,
    },
    ref,
  ) {
    const embedParent = getEmbedParent(parent);
    const playerUrl = useMemo(
      () =>
        buildTwitchPlayerUrl({
          autoplay,
          channel,
          muted,
          parent: embedParent,
          video,
        }),
      [autoplay, channel, embedParent, muted, video],
    );

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
          title="Twitch stream player"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            onReady?.();
            onWebViewLoaded?.();
          }}
          src={playerUrl}
          style={styles.iframe}
        />
        <View style={styles.footer}>
          <Text color="gray.contrast" type="xs" numberOfLines={1}>
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
            <Text color="gray.contrast" type="xs" weight="semibold">
              Open
            </Text>
          </Button>
        </View>
      </View>
    );
  },
);

export function StreamPlayerPrewarm() {
  return null;
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
