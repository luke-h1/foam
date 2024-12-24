import { spacing } from '@app/styles';
import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import Icon, { IconProps } from './ui/Icon';
import { Text } from './ui/Text';

export interface SocialButtonProps extends PressableProps {
  /**
   * The Icon to display
   */

  icon: IconProps['icon'];

  /**
   * The size of the icon
   */
  size?: number;

  /**
   * Style overrides
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Helper text
   */
  helperText?: string;
}

export function SocialButton({
  size = 24,
  icon,
  style: $styleOverride,
  onPress,
  helperText,
  ...rest
}: SocialButtonProps) {
  return (
    <Pressable
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={onPress}
    >
      <Pressable
        onPress={onPress}
        style={[$socialButton, $styleOverride]}
        accessibilityRole="button"
        accessibilityLabel={icon}
        accessibilityHint={`Navigates to ${icon}`}
        {...rest}
      >
        <Icon icon={icon} size={size} />
      </Pressable>
      {helperText && <Text style={$text}>{helperText}</Text>}
    </Pressable>
  );
}

const $text: TextStyle = {
  marginLeft: 8,
};

interface SocialButtonsProps {
  socialButtons: SocialButtonProps[];
}

export function SocialButtons({ socialButtons }: SocialButtonsProps) {
  return (
    <>
      {socialButtons.map((socialButtonProps, index) => (
        <SocialButton
          {...socialButtonProps}
          // eslint-disable-next-line react/no-array-index-key
          key={`${socialButtonProps.icon}-${index}`}
          style={socialButtons.length - 1 > index && $socialButtons}
        />
      ))}
    </>
  );
}

const $socialButton: ViewStyle = {
  backgroundColor: '#1C2B3D',
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: 'center',
  justifyContent: 'center',
  display: 'flex',
  flexDirection: 'row',
};

const $socialButtons: ViewStyle = {
  marginEnd: spacing.medium,
};
