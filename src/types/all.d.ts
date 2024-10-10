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

declare module 'react-devtools-core' {
  export function connectToDevTools(options?: {
    host?: string;
    port?: number;
    isAppActive?: () => boolean;
    resolveRNStyle?: (style: any) => any;
  }): void;
}
