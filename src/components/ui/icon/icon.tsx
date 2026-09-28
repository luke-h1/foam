import {
  type AndroidSymbol,
  type SFSymbol,
  SymbolView as ExpoSymbolView,
  type SymbolViewProps,
} from 'expo-symbols';

import { sfSymbolToAndroid } from './util/sf-symbol-to-android';

export type {
  AndroidSymbol,
  SFSymbol,
  SymbolViewProps,
  SymbolWeight,
} from 'expo-symbols';

type PlatformSymbolName = {
  ios?: SFSymbol;
  android?: AndroidSymbol;
  web?: AndroidSymbol;
};

function isPlatformSymbolName(
  name: SymbolViewProps['name'],
): name is PlatformSymbolName {
  return name instanceof Object;
}

export function SymbolView({ name, ...rest }: SymbolViewProps) {
  const resolvedName = isPlatformSymbolName(name)
    ? name
    : {
        ios: name,
        android: sfSymbolToAndroid(name),
        web: sfSymbolToAndroid(name),
      };

  return <ExpoSymbolView name={resolvedName} {...rest} />;
}
