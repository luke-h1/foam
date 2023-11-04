import React from 'react';
import { PressableProps } from './Pressable';

// eslint-disable-next-line no-shadow
export enum StreamListSize {
  ExtraSmall = 'ExtraSmall',
  MidMedium = 'MidMedium',
  Large = 'Large',
}

interface Props extends PressableProps {
  stream: unknown;
  size: StreamListSize;
  onPress?: () => void;
}

const StreamListCard = ({ size, stream, onPress, ...props }: Props) => {
  switch (size) {
    case StreamListSize.ExtraSmall:
      return <ExtraSmallStreamListCard {...{ stream, onPress }} {...props} />;
    case StreamListSize.MidMedium:
      return <MidMediumStreamListCard {...{ stream, onPress }} {...props} />;
    case StreamListSize.Large:
      return <LargeStreamListCard {...{ stream, onPress }} {...props} />;

    default:
      throw new Error(`Invalid size: ${size}`);
  }
};

export default StreamListCard;
