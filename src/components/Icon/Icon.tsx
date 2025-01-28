/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-require-imports */
import React, { ComponentType } from 'react';
import {
  ImageStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import { useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const iconType = {
  FontAwesome: 'FontAwesome',
  AntDesign: 'AntDesign',
  MaterialIcons: 'MaterialIcons',
  EvilIcons: 'EvilIcons',
  Entypo: 'Entypo',
  Foundation: 'Foundation',
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Zocial: 'Zocial',
  Octicons: 'Octicons',
  SimpleLineIcons: 'SimpleLineIcons',
  Fontisto: 'Fontisto',
  Feather: 'Feather',
  FontAwesome5: 'FontAwesome5',
} as const;

type IconType = keyof typeof iconType;

// todo - refactor this to be static imgs
const iconComponents: Record<string, typeof Feather> = {
  AntDesign: require('react-native-vector-icons/AntDesign').default,
  Entypo: require('react-native-vector-icons/Entypo').default,
  Ionicons: require('react-native-vector-icons/Ionicons').default,
  SimpleLineIcons: require('react-native-vector-icons/SimpleLineIcons').default,
  EvilIcons: require('react-native-vector-icons/EvilIcons').default,
  MaterialIcons: require('react-native-vector-icons/MaterialIcons').default,
  FontAwesome: require('react-native-vector-icons/FontAwesome').default,
  FontAwesome5: require('react-native-vector-icons/FontAwesome5').default,
  Foundation: require('react-native-vector-icons/Foundation').default,
  MaterialCommunityIcons:
    require('react-native-vector-icons/MaterialCommunityIcons').default,
  Zocial: require('react-native-vector-icons/Zocial').default,
  Octicons: require('react-native-vector-icons/Octicons').default,
  Fontisto: require('react-native-vector-icons/Fontisto').default,
  Feather: require('react-native-vector-icons/Feather').default,
} as const;

export interface IconProps extends TouchableOpacityProps {
  /**
   * The name of the icon
   */
  icon: string;

  /**
   * The icon family to use
   * @default Feather
   */
  iconFamily?: IconType;

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
export function Icon({
  icon,
  iconFamily = 'Feather',
  color,
  size = 18,
  containerStyle: $containerStyleOverride,
  ...WrapperProps
}: IconProps) {
  const isPressable = !!WrapperProps.onPress;

  const { theme } = useStyles();

  const Wrapper: ComponentType<TouchableOpacityProps> = (
    isPressable ? TouchableOpacity : View
  ) as ComponentType<TouchableOpacityProps>;

  const IconComponent = iconComponents[
    iconFamily || 'Feather'
  ] as typeof Feather;

  return (
    <Wrapper
      accessibilityRole={isPressable ? 'imagebutton' : undefined}
      {...WrapperProps}
      style={$containerStyleOverride}
    >
      <IconComponent
        name={icon}
        size={size}
        color={color ?? theme.colors.text}
      />
    </Wrapper>
  );
}
