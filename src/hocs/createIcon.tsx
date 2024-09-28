/* eslint-disable react/no-unused-prop-types */
import { DynamicColor } from '@app/hooks/useSporeColors';
import { IconSizeTokens } from '@app/styles';
import type { IconProps as TamaguiIconProps } from '@tamagui/helpers-icon';
import {
  ForwardRefExoticComponent,
  ForwardedRef,
  FunctionComponent,
  RefAttributes,
  createElement,
  forwardRef,
} from 'react';
import { Svg, SvgProps } from 'react-native-svg';
import {
  ColorTokens,
  isWeb,
  SpecificTokens,
  Stack,
  styled,
  ThemeKeys,
  usePropsAndStyle,
} from 'tamagui';
import { withAnimated } from './withAnimated';

type SvgPropsWithRef = SvgProps & {
  ref: ForwardedRef<Svg>;
  style?: { color?: string };
};

export type IconProps = Omit<
  Omit<TamaguiIconProps, 'size' | 'width' | 'height'>,
  'color'
> & {
  size?: IconSizeTokens | number;
  // we need the string & {} to allow strings but not lose the intellisense autocomplete
  color?: (ColorTokens | ThemeKeys | (string & {})) | DynamicColor | null;
  Component?: FunctionComponent<SvgPropsWithRef>;
};

const getSize = <TValue extends SpecificTokens | number>(value: TValue) => ({
  width: value,
  height: value,
});

// used by usePropsAndStyle to resolve a variant
const IconFrame = styled(Stack, {
  variants: {
    size: {
      '...': getSize,
    },
  },
});

export type GeneratedIcon = ForwardRefExoticComponent<
  IconProps & RefAttributes<Svg>
>;

interface CreateIconProps {
  name: string;
  getIcon: (props: SvgPropsWithRef) => JSX.Element;
  defaultFill?: string;
}

export default function createIcon({
  name,
  getIcon,
  defaultFill,
}: CreateIconProps): readonly [GeneratedIcon, GeneratedIcon] {
  const Icon = forwardRef<Svg, IconProps>((iconProps, ref) => {
    const [props, style] = usePropsAndStyle(
      {
        color: defaultFill ?? (isWeb ? 'currentColor' : undefined),
        size: '$icon.8',
        strokeWidth: 8,
        ...iconProps,
      },
      {
        resolveValues: 'value',
        forComponent: IconFrame,
      },
    );
    const svgProps: SvgPropsWithRef = {
      ref,
      ...iconProps,
      // @ts-expect-error - hard to type this but it's valid
      style,
    };

    if (props.Component) {
      return createElement(props.Component, svgProps);
    }
    return getIcon(svgProps);
  });
  Icon.displayName = name;

  const IconPlain = forwardRef<Svg, IconProps>((props, ref) => {
    return getIcon({
      ...(props as unknown as SvgPropsWithRef),
      ref,
    });
  });

  IconPlain.displayName = name;

  const AnimatedIconPlain = withAnimated(IconPlain);

  const AnimatedIcon = forwardRef<Svg, IconProps>((props, ref) => {
    return (
      <Icon
        ref={ref}
        {...props}
        Component={
          AnimatedIconPlain as unknown as FunctionComponent<SvgPropsWithRef>
        }
      />
    );
  });
  AnimatedIcon.displayName = `Animated${name}`;

  return [Icon, AnimatedIcon] as const;
}
