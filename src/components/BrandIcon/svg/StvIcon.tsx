import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface StvIconProps extends SvgProps {
  color?: string;
}

export const StvIcon: React.FC<StvIconProps> = ({
  color = '#FFF',
  ...props
}) => (
  <Svg
    width={30}
    height={30}
    viewBox="0 0 128 128"
    fill="none"
    {...props}
    color={color}
  >
    <Path
      d="M90.986 45.953l4.934-8.603 2.664-4.549-4.934-8.603V24H67.304l9.867 17.206 2.763 4.747h11.052zM36.616 103.703l29.602-51.619 3.651-6.329-9.867-17.206-2.763-4.45H15.598l-4.934 8.603L8 37.251l4.934 8.603v.198H44.51L19.84 89.068l-3.454 6.131 4.934 8.603V104h15.295M77.862 103.703h15.097l19.735-34.413 3.454-5.933-4.934-8.603v-.198H96.018l-9.867 17.206-.691 1.286-9.868-17.206-.69-1.286-9.868 17.206-2.762 4.747 14.8 25.809.79 1.385z"
      fill={color}
    />
  </Svg>
);
