import {
  SymbolView as ExpoSymbolView,
  type SymbolViewProps,
} from 'expo-symbols';

import { sfSymbolToAndroid } from './sfSymbolToAndroid';

export type {
  AndroidSymbol,
  SFSymbol,
  SymbolViewProps,
  SymbolWeight,
} from 'expo-symbols';

// eslint-disable-next-line react-doctor/only-export-components -- shared icon-name constant
export const BACK_SYMBOL_NAME = {
  ios: 'chevron.left',
  android: 'arrow_back',
  web: 'arrow_back',
} as const;

export function SymbolView({ name, ...rest }: SymbolViewProps) {
  const resolvedName =
    typeof name === 'string'
      ? {
          ios: name,
          android: sfSymbolToAndroid(name),
          web: sfSymbolToAndroid(name),
        }
      : name;

  return <ExpoSymbolView name={resolvedName} {...rest} />;
}
