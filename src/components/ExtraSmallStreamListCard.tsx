import React from 'react';
import Box from './Box';
import Image from './Image';
import Pressable, { PressableProps } from './Pressable';
import Text from './Text';

const IMAGE_ASPECT_RATIO = 320 / 180;
const IMAGE_HEIGHT = 62;
const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;

export interface ExtraSmallStreamListCardProps extends PressableProps {
  stream: unknown;
}

const ExtraSmallStreamListCard = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stream,
  ...props
}: ExtraSmallStreamListCardProps) => {
  return (
    <Pressable {...props}>
      <Box paddingVertical="sToM" paddingRight="xs" flexDirection="row">
        <Box
          position="relative"
          backgroundColor="disabledButtonBackground"
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          marginRight="sToM"
        >
          <Image
            source={{ uri: 'https://picsum.photos/200/300' }}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
          />
          <Box
            position="absolute"
            left={0}
            bottom={0}
            height={4}
            backgroundColor="primaryHighlight"
          />
        </Box>
        <Box flex={1}>
          <Text
            variant="videoCardUsername"
            numberOfLines={2}
            ellipsizeMode="tail"
            marginBottom="xs"
          >
            Title of stream
          </Text>
          <Text color="secondaryText" fontSize={15} numberOfLines={1}>
            GAME NAME. 1.2k viewers
          </Text>
        </Box>
      </Box>
    </Pressable>
  );
};
export default ExtraSmallStreamListCard;
