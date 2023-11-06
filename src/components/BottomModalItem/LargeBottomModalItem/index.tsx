import React, { FC } from 'react';
import { ImageSourcePropType } from 'react-native';
import { SvgProps } from 'react-native-svg';
import RightArrowIcon from '../../../../assets/images/arrow_right.svg';
import Box from '../../Box';
import Image from '../../Image';
import Pressabble, { PressableProps } from '../../Pressable';
import SVGIcon from '../../SVGIcon';
import Text from '../../Text';

interface LargeBottomModalItemProps extends PressableProps {
  children: string;
  icon?: FC<SvgProps>;
  imageSource?: ImageSourcePropType;
  showRightArrow?: boolean;
}

const LargeBottomModalItem = ({
  children,
  icon,
  imageSource,
  showRightArrow,
  ...props
}: LargeBottomModalItemProps) => {
  const ICON_SIZE = 42;

  return (
    <Pressabble
      backgroundColor="gray6"
      paddingVertical="mToL"
      paddingHorizontal="sToMtoM"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      {...props}
    >
      <Box flexDirection="row" alignItems="center">
        {icon && (
          <SVGIcon
            icon={icon}
            width={ICON_SIZE}
            height={ICON_SIZE}
            marginRight="m"
            color="secondaryText"
          />
        )}
        {imageSource && (
          <Image
            source={imageSource}
            width={ICON_SIZE}
            height={ICON_SIZE}
            borderRadius="l"
            marginRight="m"
          />
        )}
        <Text fontFamily="Roobert-SemiBold" fontSize={18}>
          {children}
        </Text>
      </Box>
      {showRightArrow && (
        <SVGIcon
          icon={RightArrowIcon}
          width={ICON_SIZE}
          height={ICON_SIZE}
          color="secondaryText"
        />
      )}
    </Pressabble>
  );
};
export default LargeBottomModalItem;
