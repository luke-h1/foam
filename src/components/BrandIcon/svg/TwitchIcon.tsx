import React from 'react';
import Svg, { G, Path, SvgProps } from 'react-native-svg';

interface TwitchIconProps extends SvgProps {
  color?: string;
}

export const TwitchIcon: React.FC<TwitchIconProps> = ({
  color = '#9146FF',
  ...props
}) => (
  <Svg
    id="Layer_1"
    x="0px"
    y="0px"
    viewBox="0 0 2400 2800"
    fill={color}
    {...props}
  >
    <Path
      d="M2200 1300L1800 1700 1400 1700 1050 2050 1050 1700 600 1700 600 200 2200 200z"
      fill="#fff"
    />
    <G id="Layer_1-2">
      <Path d="M500 0L0 500v1800h600v500l500-500h400l900-900V0H500zm1700 1300l-400 400h-400l-350 350v-350H600V200h1600v1100z" />
      <Path d="M1700 550H1900V1150H1700z" />
      <Path d="M1150 550H1350V1150H1150z" />
    </G>
  </Svg>
);
