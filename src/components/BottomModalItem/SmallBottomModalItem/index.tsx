import React, { FC } from 'react';
import { SvgProps } from 'react-native-svg';
import { Theme } from '../../../styles/theme';
import Pressabble, { PressableProps } from '../../Pressable';
import SVGIcon from '../../SVGIcon';
import Text from '../../Text';

interface SmallBottomModalItemProps extends PressableProps {
  children: string;
  icon?: FC<SvgProps>;
  color?: keyof Theme['colors'];
}

const SmallBottomModalItem = ({
  children,
  icon,
  color,
  ...props
}: SmallBottomModalItemProps) => {
  const ICON_SIZE = 22;

  return (
    <Pressabble
      backgroundColor="gray6"
      paddingVertical="s"
      paddingHorizontal="m"
      flexDirection="row"
      alignItems="center"
      {...props}
    >
      {icon && (
        <SVGIcon
          icon={icon}
          width={ICON_SIZE}
          height={ICON_SIZE}
          marginRight="sToM"
          color={color}
        />
      )}
      <Text fontFamily="Roobert-Medium" fontSize={16} color={color}>
        {children}
      </Text>
    </Pressabble>
  );
};
export default SmallBottomModalItem;
