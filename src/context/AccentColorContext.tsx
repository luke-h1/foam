import { colors } from '@app/styles/colors';
import { getColorValue, UIColor } from '@app/styles/ui';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

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
  'lime',
  'green',
  'emerald',
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

  const accentHex = useMemo(() => {
    return selectedHex ?? colors[scheme].tint;
  }, [scheme, selectedHex]);

  const getBackgroundColor = useMemo(() => {
    return () => {
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
    };
  }, [scheme, selectedHex]);

  const contextValue = useMemo(
    () => ({ accentHex, setAccentHex: setSelectedHex, getBackgroundColor }),
    [accentHex, getBackgroundColor],
  );

  return (
    <AccentColorContext.Provider value={contextValue}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const ctx = useContext(AccentColorContext);
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
