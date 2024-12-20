/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */
import React, { ComponentType } from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';

export type IconTypes = keyof typeof iconRegistry;

export interface IconProps extends TouchableOpacityProps {
  /**
   * The name of the icon
   */
  icon: IconTypes;

  /**
   * An optional tint color for the icon
   */
  color?: string;

  /**
   * An optional size for the icon. If not provided, the icon will be sized to the icon's resolution.
   */
  size?: number;

  /**
   * Style overrides for the icon image
   */
  imageStyle?: StyleProp<ImageStyle>;

  /**
   * Style overrides for the icon container
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * An optional function to be called when the icon is pressed
   */
  onPress?: TouchableOpacityProps['onPress'];
}

/**
 * A component to render a registered icon.
 * It is wrapped in a <TouchableOpacity /> if `onPress` is provided, otherwise a <View />.
 */
export default function Icon({
  icon,
  color,
  size,
  imageStyle: $imageStyleOverride,
  containerStyle: $containerStyleOverride,
  ...WrapperProps
}: IconProps) {
  const isPressable = !!WrapperProps.onPress;

  const Wrapper: ComponentType<TouchableOpacityProps> = (
    isPressable ? TouchableOpacity : View
  ) as ComponentType<TouchableOpacityProps>;

  const $imageStyle: StyleProp<ImageStyle> = [
    $imageStyleBase,
    color ? { tintColor: color } : undefined,
    size ? { width: size, height: size } : undefined,
    $imageStyleOverride,
  ];

  return (
    <Wrapper
      accessibilityRole={isPressable ? 'imagebutton' : undefined}
      {...WrapperProps}
      style={$containerStyleOverride}
    >
      <Image style={$imageStyle} source={iconRegistry[icon]} />
    </Wrapper>
  );
}

export const iconRegistry = {
  arrow: require('../../../assets/icons/arrows.png'),
  arrowDown: require('../../../assets/icons/arrowDown.png'),
  arrowUp: require('../../../assets/icons/arrowUp.png'),
  back: require('../../../assets/icons/back.png'),
  caretLeft: require('../../../assets/icons/caretLeft.png'),
  caretRight: require('../../../assets/icons/caretRight.png'),
  chat: require('../../../assets/icons/chat.png'),
  check: require('../../../assets/icons/check.png'),
  explore: require('../../../assets/icons/explore.png'),
  github: require('../../../assets/icons/github.png'),
  info: require('../../../assets/icons/info.png'),
  ladybug: require('../../../assets/icons/ladybug.png'),
  link: require('../../../assets/icons/link.png'),
  schedule: require('../../../assets/icons/schedule.png'),
  twitter: require('../../../assets/icons/twitter.png'),
  youtube: require('../../../assets/icons/youtube.png'),
};

const $imageStyleBase: ImageStyle = {
  resizeMode: 'contain',
};
