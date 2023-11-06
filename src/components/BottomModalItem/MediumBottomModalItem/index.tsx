import React, { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import RightArrowIcon from '../../../../assets/images/arrow_right.svg';
import Box from '../../Box';
import Pressabble, { PressableProps } from '../../Pressable';
import SVGIcon from '../../SVGIcon';
import Text from '../../Text';

interface MediumBottomModalItemProps extends PressableProps {
  children: string;
  icon?: FC<SvgProps>;
  showRightArrow?: boolean;
}

const MediumBottomModalItem = ({
  children,
  icon,
  showRightArrow,
  ...props
}: MediumBottomModalItemProps) => {
  const ICON_SIZE = 25;

  return (
    <Pressabble
      backgroundColor="gray6"
      padding="sToMtoM"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      {...props}
    >
      <Box flexDirection="row">
        {icon && (
          <SVGIcon
            icon={icon}
            width={ICON_SIZE}
            height={ICON_SIZE}
            marginRight="m"
            color="secondaryText"
          />
        )}
        <Text fontFamily="Roobert-Medium" fontSize={18}>
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
export default MediumBottomModalItem;
