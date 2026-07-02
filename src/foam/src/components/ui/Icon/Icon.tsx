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
