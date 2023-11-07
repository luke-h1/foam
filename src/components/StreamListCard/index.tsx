import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { Dimensions, GestureResponderEvent } from 'react-native';
import OptionsIcon from '../../../assets/images/options.svg';
import Box from '../Box';
import Chip, { ChipColors } from '../Chip';
import Image from '../Image';
import Pressable, { PressableProps } from '../Pressable';
import SVGIcon, { SvgIconProps } from '../SVGIcon';
import Text from '../Text';

interface StreamListCardProps extends PressableProps {
  stream: unknown;
  size: 'small' | 'medium' | 'large';
  optionsIconProps: {
    pressable?: Omit<PressableProps, 'onPress'> & {
      onPress?: ((event: GestureResponderEvent, user?: unknown) => void) | null;
    };
    icon?: SvgIconProps;
  };
}

const StreamListCard = ({
  stream,
  size,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPress,
  optionsIconProps,
  ...props
}: StreamListCardProps) => {
  const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
  // if (!stream) {
  //   return null;
  // }

  switch (size) {
    case 'small': {
      const IMAGE_ASPECT_RATIO = 320 / 180;
      const IMAGE_HEIGHT = 62;
      const IMAGE_WIDTH = IMAGE_HEIGHT * IMAGE_ASPECT_RATIO;
      return (
        <Pressable
          paddingVertical="sToM"
          paddingRight="xs"
          flexDirection="row"
          {...props}
        >
          <Box
            position="relative"
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            marginRight="sToM"
          >
            <Image
              source={{ uri: 'https://picsum.photos/200/300' }}
              width={IMAGE_WIDTH}
              height={IMAGE_HEIGHT}
            />
            <Box position="absolute" left={2} bottom={2}>
              <Text fontSize={12}>1.1k viewers</Text>
            </Box>
          </Box>
          <Box flex={1}>
            <Box flexDirection="row" justifyContent="space-between">
              <Box
                flex={1}
                flexDirection="column"
                justifyContent="space-between"
              >
                <Box flexDirection="row">
                  <Image
                    source={{
                      // broadcaster profile image
                      uri: 'https://picsum.photos/200/300',
                    }}
                    width={22}
                    aspectRatio={1}
                    borderRadius="l"
                    marginRight="s"
                  />
                  <Text
                    variant="videoCardUsername"
                    alignSelf="center"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    username
                  </Text>
                </Box>
                <Text lineHeight={22} variant="videoCardText" numberOfLines={1}>
                  stream title
                </Text>
                <Text lineHeight={19} variant="videoCardText" numberOfLines={1}>
                  game name
                </Text>
              </Box>
              <Pressable
                justifyContent="center"
                {...optionsIconProps?.pressable}
                onPress={e => {
                  optionsIconProps?.pressable?.onPress?.(e, stream);
                }}
              >
                <SVGIcon
                  icon={OptionsIcon}
                  width={22}
                  height={22}
                  color="secondaryText"
                  {...optionsIconProps?.icon}
                />
              </Pressable>
            </Box>
            {tags.length > 0 && (
              <Box flexDirection="row" marginTop="xxs">
                <FlashList
                  data={tags}
                  renderItem={({ item }) => (
                    <Chip
                      key={item}
                      color={ChipColors.PrimaryOutline}
                      marginRight="s"
                    >
                      {item}
                    </Chip>
                  )}
                  estimatedItemSize={75}
                  showsHorizontalScrollIndicator={false}
                  horizontal
                />
              </Box>
            )}
          </Box>
        </Pressable>
      );
    }
    case 'medium': {
      return (
        <Pressable {...props}>
          <Box
            width={Dimensions.get('window').width * 0.65}
            marginTop="sToM"
            marginRight="sToM"
          >
            <Image
              source={{
                uri: 'https://picsum.photos/200/300',
              }}
              width={Dimensions.get('window').width * 0.65}
              aspectRatio={16 / 9}
            />
            <Box
              flexDirection="row"
              paddingVertical="sToM"
              paddingLeft="sToM"
              alignItems="flex-start"
              justifyContent="space-between"
            >
              {/* broadcaster profile image */}
              <Image
                source={{ uri: 'https://picsum.photos/200/300' }}
                width={30}
                aspectRatio={1}
                borderRadius="l"
                marginRight="s"
              />
              <Box flex={1}>
                <Text
                  lineHeight={18}
                  variant="videoCardUsername"
                  numberOfLines={1}
                >
                  broadcaster username
                </Text>
                <Text variant="videoCardText" numberOfLines={1}>
                  stream title
                </Text>
                <Text variant="videoCardText" numberOfLines={1}>
                  game name
                </Text>
              </Box>
              <Pressable
                {...optionsIconProps?.pressable}
                onPress={e => {
                  optionsIconProps?.pressable?.onPress?.(e, stream);
                }}
              >
                <SVGIcon
                  icon={OptionsIcon}
                  width={22}
                  height={22}
                  color="secondaryText"
                  {...optionsIconProps?.icon}
                />
              </Pressable>
            </Box>
          </Box>
        </Pressable>
      );
    }
    case 'large': {
      return (
        <Pressable {...props}>
          <Box
            width={Dimensions.get('window').width}
            marginTop="sToM"
            marginRight="sToM"
          >
            <Image
              source={{ uri: 'https://picsum.photos/200/300' }}
              width={Dimensions.get('window').width}
              aspectRatio={16 / 9}
            />
            <Box
              flexDirection="row"
              paddingVertical="sToM"
              padding="sToM"
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Image
                source={{ uri: 'https://picsum.photos/200/300' }}
                width={40}
                aspectRatio={1}
                borderRadius="l"
                marginRight="sToStoM"
              />
              <Box flex={1}>
                <Box>
                  <Text
                    lineHeight={18}
                    variant="videoCardUsername"
                    numberOfLines={1}
                  >
                    broadcaster username
                  </Text>
                  <Text variant="videoCardText" numberOfLines={1}>
                    stream title
                  </Text>
                  <Text variant="videoCardText" numberOfLines={1}>
                    game name
                  </Text>
                </Box>
                <Box flexDirection="row" marginTop="xs">
                  {tags.map(
                    (tag, index) =>
                      index < 3 && (
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
              <Pressable
                {...optionsIconProps?.pressable}
                onPress={e => {
                  optionsIconProps?.pressable?.onPress?.(e, stream);
                }}
              >
                <SVGIcon
                  icon={OptionsIcon}
                  width={22}
                  height={22}
                  color="secondaryText"
                  {...optionsIconProps?.icon}
                />
              </Pressable>
            </Box>
          </Box>
        </Pressable>
      );
    }

    default: {
      return null;
    }
  }
};
export default StreamListCard;
