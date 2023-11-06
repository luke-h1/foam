/* eslint-disable no-shadow */
import React, { FC } from 'react';
import { ImageSourcePropType } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { Theme } from '../../styles/theme';
import { PressableProps } from '../Pressable';
import LargeBottomModalItem from './LargeBottomModalItem';
import MediumBottomModalItem from './MediumBottomModalItem';
import SmallBottomModalItem from './SmallBottomModalItem';

enum BottomModalItemColors {
  Default = 'Default',
  Red = 'Red',
}

enum BottomModalItemSizes {
  Small = 'Small',
  Medium = 'Medium',
  Large = 'Large',
}

interface BottomModalItemProps extends PressableProps {
  children: string;
  color?: BottomModalItemColors;
  icon?: FC<SvgProps>;
  imageSource?: ImageSourcePropType;
  size: BottomModalItemSizes;
  isFirst?: boolean;
  isLast?: boolean;
  isAlone?: boolean;
  showRightArrow?: boolean;
}

type BottomModalItemColorsData = {
  [color in BottomModalItemColors]: keyof Theme['colors'];
};

const bottomModalItemColors: BottomModalItemColorsData = {
  [BottomModalItemColors.Default]: 'primaryText',
  [BottomModalItemColors.Red]: 'colorRed11',
};

const BottomModalItem = ({
  size,
  color = BottomModalItemColors.Default,
  isFirst,
  isLast,
  isAlone,
  ...props
}: BottomModalItemProps) => {
  const currentColor = bottomModalItemColors[color];

  switch (size) {
    case BottomModalItemSizes.Small: {
      return (
        <SmallBottomModalItem
          color={currentColor}
          {...(isFirst && {
            borderTopLeftRadius: 's',
            borderTopRightRadius: 's',
          })}
          {...(isLast && {
            borderBottomLeftRadius: 's',
            borderBottomRightRadius: 's',
          })}
          {...(isAlone && {
            borderRadius: 's',
          })}
          {...(isLast || isAlone
            ? {
                marginBottom: 'm',
              }
            : {
                borderBottomWidth: 1,
                borderBottomColor: 'highlightBackground',
              })}
          {...props}
        />
      );
    }

    case BottomModalItemSizes.Medium: {
      return (
        <MediumBottomModalItem
          {...(isFirst && {
            borderTopLeftRadius: 's',
            borderTopRightRadius: 's',
          })}
          {...(isLast && {
            borderBottomLeftRadius: 's',
            borderBottomRightRadius: 's',
          })}
          {...(isAlone && {
            borderRadius: 's',
          })}
          {...(isLast || isAlone
            ? {
                marginBottom: 'm',
              }
            : {
                borderBottomWidth: 1,
                borderBottomColor: 'highlightBackground',
              })}
          {...props}
        />
      );
    }
    case BottomModalItemSizes.Large: {
      return (
        <LargeBottomModalItem
          {...(isFirst && {
            borderTopLeftRadius: 's',
            borderTopRightRadius: 's',
          })}
          {...(isLast && {
            borderBottomLeftRadius: 's',
            borderBottomRightRadius: 's',
          })}
          {...(isAlone && {
            borderRadius: 's',
          })}
          {...(isLast || isAlone
            ? {
                marginBottom: 'm',
              }
            : {
                borderBottomWidth: 1,
                borderBottomColor: 'highlightBackground',
              })}
          {...props}
        />
      );
    }

    default:
      return null;
  }
};
export default BottomModalItem;
