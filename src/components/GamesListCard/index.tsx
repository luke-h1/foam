import React from 'react';
import Box from '../Box';
import Chip, { ChipColors } from '../Chip';
import Image from '../Image';
import Pressabble, { PressableProps } from '../Pressable';
import Text from '../Text';

interface GameListCardProps extends PressableProps {
  game?: unknown;
  size: 'small' | 'medium' | 'large';
}

const GameListCard = ({ game, size, ...props }: GameListCardProps) => {
  if (!game) {
    return null;
  }

  const tags = ['tag1', 'tag2', 'tag3'];

  switch (size) {
    case 'small': {
      const IMAGE_WIDTH = 55;
      return (
        <Pressabble {...props}>
          <Box flexDirection="row" marginBottom="m">
            <Image
              source={{ uri: 'https://picsum.photos/200/300' }}
              width={IMAGE_WIDTH}
              aspectRatio={285 / 380}
              marginRight="m"
            />
            <Box flex={1} justifyContent="center">
              <Text fontSize={18} fontFamily="Roobert-Bold" numberOfLines={1}>
                Game Name
              </Text>
              <Text
                fontSize={16}
                fontFamily="Roobert-Medium"
                color="secondaryText"
              >
                1k viewers
              </Text>
              <Box flexDirection="row" marginTop="xxs">
                {tags.map(
                  (tag, index) =>
                    index < 2 && (
                      <Chip
                        key={tag}
                        color={ChipColors.PrimaryOutline}
                        marginRight="s"
                      >
                        {tag}
                      </Chip>
                    ),
                )}
              </Box>
            </Box>
          </Box>
        </Pressabble>
      );
    }

    case 'medium': {
      const IMAGE_WIDTH = 105;
      return (
        <Pressabble {...props}>
          <Box width={IMAGE_WIDTH} paddingVertical="sToM" marginRight="sToM">
            <Image
              source={{ uri: 'https://picsum.photos/200/300' }}
              width={IMAGE_WIDTH}
              aspectRatio={285 / 380}
              marginBottom="xxs"
            />
            <Text fontSize={17} fontFamily="Roobert-Bold" numberOfLines={1}>
              Game Name
            </Text>
          </Box>
        </Pressabble>
      );
    }

    case 'large': {
      const IMAGE_WIDTH = 140;

      return (
        <Pressabble {...props}>
          <Box width={IMAGE_WIDTH} paddingVertical="sToM" marginRight="sToM">
            <Image
              source={{ uri: 'https://picsum.photos/200/300' }}
              width={IMAGE_WIDTH}
              aspectRatio={285 / 380}
            />
            <Text fontSize={18} fontFamily="Roobert-Bold" numberOfLines={1}>
              Game Name
            </Text>
            <Text
              fontSize={16}
              fontFamily="Roobert-Medium"
              color="secondaryText"
            >
              1.6k viewers
            </Text>
            <Box flexDirection="row" marginTop="xxs">
              {tags.map(
                (tag, index) =>
                  index < 2 && (
                    <Chip
                      key={tag}
                      color={ChipColors.PrimaryOutline}
                      marginRight="s"
                    >
                      {tag}
                    </Chip>
                  ),
              )}
            </Box>
          </Box>
        </Pressabble>
      );
    }

    default:
      return null;
  }
};
export default GameListCard;
