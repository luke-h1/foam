import { config } from '../../tamagui.config';
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';

  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.png' {
  const value: any;
  export = value;
}

declare module '*.jpg' {
  const value: any;
  export = value;
}

declare module '*.m3u' {
  const value: any;
  export = value;
}

type Conf = typeof config;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}
}
