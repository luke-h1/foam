import React, {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { colors } from '@app/styles/colors';
import { getColorValue, UIColor } from '@app/styles/ui';

interface AccentColorContextValue {
  accentHex: string;
  setAccentHex: (hex: string | null) => void;
  getBackgroundColor: () => string;
}

const AccentColorContext = createContext<AccentColorContextValue | undefined>(
  undefined,
);

const colorFamilies: UIColor[] = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];

export function AccentColorProvider({
  children,
  initialHex = null,
}: {
  children: React.ReactNode;
  initialHex?: string | null;
}) {
  const colorScheme = useColorScheme();
  const [selectedHex, setSelectedHex] = useState<string | null>(initialHex);
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  const accentHex = selectedHex ?? colors[scheme].tint;

  const getBackgroundColor = useCallback(() => {
    if (!selectedHex) {
      return colors[scheme].background;
    }
    const targetShade = scheme === 'dark' ? 950 : 50;
    const matchedFamily = colorFamilies.find(
      family =>
        selectedHex === getColorValue(family, scheme === 'dark' ? 400 : 500),
    );

    return matchedFamily
      ? getColorValue(matchedFamily, targetShade)
      : colors[scheme].background;
  }, [selectedHex, scheme]);

  // Memoized so consumers (the chat composer and input among them) only
  // re-render when the accent actually changes, not on every provider render.
  const contextValue = useMemo(
    () =>
      ({
        accentHex,
        setAccentHex: setSelectedHex,
        getBackgroundColor,
      }) satisfies AccentColorContextValue,
    [accentHex, getBackgroundColor],
  );

  return (
    <AccentColorContext.Provider value={contextValue}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor(): AccentColorContextValue {
  const ctx = use(AccentColorContext);
  const colorScheme = useColorScheme();

  if (ctx) {
    return ctx;
  }

  const scheme = colorScheme === 'dark' ? 'dark' : 'light';

  return {
    accentHex: colors[scheme].tint,
    setAccentHex: () => {},
    getBackgroundColor: () => colors[scheme].background,
  };
}
