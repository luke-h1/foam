import { colors, spacing } from '@app/styles';
import React, { ReactNode, useState } from 'react';
import { ImageStyle, StyleProp, View, ViewStyle } from 'react-native';

type Presets = keyof typeof $offsetPresets;

interface BoxShadowProps {
  children: ReactNode;
  preset: Presets;
  style?: StyleProp<ViewStyle>;
  offset?: number;
}

export default function BoxShadow({
  children,
  preset: defaultPreset = 'default',
  offset,
  style,
}: BoxShadowProps) {
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const preset: Presets = defaultPreset;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const $offset: StyleProp<ImageStyle> = [
    $offsetPresets[preset],
    { height, width },
  ];

  const offsetAmount = offset || spacing.tiny;
  const $offsetContainerSpacing = { left: offsetAmount, top: offsetAmount };

  return (
    <View style={style}>
      <View
        onLayout={e => {
          setHeight(e.nativeEvent.layout.height);
          setWidth(e.nativeEvent.layout.width);
        }}
        style={{ marginEnd: offsetAmount, marginBottom: offsetAmount }}
      >
        <View style={[$offsetContainer, $offsetContainerSpacing]} />
        <View>{children}</View>
      </View>
    </View>
  );
}

const $offsetContainer: ViewStyle = {
  position: 'absolute',
};

const $offsetPresets = {
  default: [
    {
      borderColor: colors.palette.primary500,
      borderWidth: 1,
      tintColor: colors.palette.primary500,
    },
  ],

  primary: [
    {
      backgroundColor: colors.palette.primary500,
      tintColor: colors.palette.secondary500,
      borderColor: colors.palette.neutral700,
      borderWidth: 1,
    },
  ] as StyleProp<ImageStyle>,

  secondary: [
    {
      tintColor: colors.palette.secondary500,
      borderColor: colors.palette.neutral400,
      borderWidth: 1,
    },
  ] as StyleProp<ImageStyle>,

  reversed: [
    {
      borderColor: colors.palette.neutral400,
      borderWidth: 1,
      tintColor: colors.palette.neutral400,
    },
  ] as StyleProp<ImageStyle>,

  bold: [
    {
      backgroundColor: colors.palette.bold500,
      tintColor: colors.palette.highlight500,
      borderColor: colors.palette.neutral700,
      borderWidth: 1,
    },
  ] as StyleProp<ImageStyle>,
};
