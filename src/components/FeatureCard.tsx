import { layout, spacing } from '@app/styles';
import { openLinkInBrowser } from '@app/utils/openLinkInBrowser';
import React from 'react';
import { ViewStyle, View, Pressable, useWindowDimensions } from 'react-native';
import AutoImage from './ui/AutoImage';
import Icon from './ui/Icon';
import { Text } from './ui/Text';

type CommonProps<T> = {
  containerStyle?: ViewStyle;
  tier: T;
};

type DefaultFeatureProps<T> = CommonProps<T> & {
  externalURL?: string;
  logo: { uri: string };
  promoSummary: string;
  feature: string;
};

type FeatureCardProps = DefaultFeatureProps<'default'>;

interface MaxImageReturn {
  maxWidth: number;
  maxHeight: number;
}

function maxImageDimensions(
  tier: FeatureCardProps['tier'],
  width: number,
): MaxImageReturn {
  const iconWidth = spacing.large + spacing.medium;

  switch (tier) {
    case 'default':
    default:
      return {
        maxWidth: width * 0.9 - iconWidth,
        maxHeight: 60,
      };
  }
}

export default function FeatureCard(props: FeatureCardProps) {
  const { width: screenWidth } = useWindowDimensions();

  function maxImageDimensionsForContent(tier: FeatureCardProps['tier']) {
    return maxImageDimensions(tier, screenWidth - layout.horizontalGutter * 2);
  }

  // eslint-disable-next-line react/destructuring-assignment, default-case
  switch (props.tier) {
    case 'default': {
      const { feature, logo, promoSummary, tier, containerStyle, externalURL } =
        props;

      return (
        <View style={[$featureContainer, containerStyle]}>
          <Pressable
            style={$featureTitle}
            onPress={
              externalURL ? () => openLinkInBrowser(externalURL) : undefined
            }
          >
            <AutoImage
              {...maxImageDimensionsForContent(tier)}
              accessibilityLabel={feature}
              source={logo}
            />
            <Icon icon="arrow" containerStyle={$iconButton} />
          </Pressable>
          <Text>{promoSummary}</Text>
        </View>
      );
    }
  }
}

const $featureContainer: ViewStyle = {
  marginVertical: spacing.large,
};

const $featureTitle: ViewStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
};
const $iconButton: ViewStyle = {
  marginStart: spacing.medium,
};
