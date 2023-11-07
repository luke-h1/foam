/* eslint-disable no-shadow */
import {
  BackgroundColorProps,
  BorderProps,
  LayoutProps,
  SpacingProps,
  backgroundColor,
  border,
  createRestyleComponent,
  layout,
  spacing,
} from '@shopify/restyle';
import {
  VideoProps as ExpoVideoProps,
  Video as ExpoVideo,
  AVPlaybackStatusSuccess,
} from 'expo-av';
import React, { useRef, useState } from 'react';
import PlayIcon from '../../assets/play.png';
import { Theme } from '../styles/theme';
import Box from './Box';
import Image from './Image';
import Pressable from './Pressable';

type VideoProps = SpacingProps<Theme> &
  LayoutProps<Theme> &
  BackgroundColorProps<Theme> &
  BorderProps<Theme> &
  Omit<ExpoVideoProps, 'height' | 'width' | 'borderRadius'> & {
    isPlayable?: boolean;
    pauseEnabled?: boolean;
  };

const Component = createRestyleComponent<VideoProps, Theme>(
  [spacing, backgroundColor, border, layout],
  ExpoVideo,
);


const Video = ({
  isPlayable = true,
  pauseEnabled = true,
  ...props
}: VideoProps) => {
  const video = useRef<ExpoVideo>(null);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess>();

  const onPressPlay = () => {
    if (video && video.current) {
      video.current.playAsync();
    }
  };

  const onPressPause = () => {
    if (video && video.current) {
      video.current.pauseAsync();
    }
  };

  return (
    <Box flex={1} position="relative">
      {pauseEnabled ? (
        <Pressable onPress={onPressPause}>
          <Component
            ref={video}
            isLooping
            
            onPlaybackStatusUpdate={status =>
              setStatus(status as AVPlaybackStatusSuccess)
            }
            {...props}
          />
        </Pressable>
      ) : (
        <Component
          ref={video}
          isLooping
          onPlaybackStatusUpdate={status =>
            setStatus(status as AVPlaybackStatusSuccess)
          }
          {...props}
        />
      )}
      {(!status || !status.isPlaying) && isPlayable && (
        <Box
          position="absolute"
          top={0}
          left={0}
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100%"
        >
          <Pressable onPress={onPressPlay}>
            <Image source={PlayIcon} width={200} height={200} />
          </Pressable>
        </Box>
      )}
    </Box>
  );
};

export default Video;
