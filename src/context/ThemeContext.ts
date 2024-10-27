import {
  type Theme,
  type ThemeContexts,
  type ThemedStyle,
  type ThemedStyleArray,
  lightTheme,
  darkTheme,
} from '@app/theme';
import {
  DarkTheme,
  DefaultTheme,
  useTheme as useNavTheme,
} from '@react-navigation/native';
import * as SystemUI from 'expo-system-ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleProp, useColorScheme } from 'react-native';

export interface ThemeContextState {
  themeScheme: ThemeContexts;
  setThemeContextOverride: (theme: ThemeContexts) => void;
}

export const ThemeContext = createContext<ThemeContextState>({
  themeScheme: undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setThemeContextOverride: _theme => {
    // eslint-disable-next-line no-console
    console.error(
      'Tried to call setThemeContextOverride before the ThemeProvider was initialized',
    );
  },
});

const toTheme = (themeContext: ThemeContexts): Theme => {
  return themeContext === 'dark' ? darkTheme : lightTheme;
};

const setImperativeTheming = (theme: Theme) => {
  SystemUI.setBackgroundColorAsync(theme.colors.background);
};

export const useThemeProvider = (initialTheme: ThemeContexts = undefined) => {
  const colorScheme = useColorScheme();
  const [overrideTheme, setTheme] = useState<ThemeContexts>(initialTheme);

  const setThemeContextOverride = useCallback((newTheme: ThemeContexts) => {
    setTheme(newTheme);
  }, []);

  const themeScheme = overrideTheme || colorScheme || 'light';
  const navigationTheme = themeScheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    setImperativeTheming(toTheme(themeScheme));
  }, [themeScheme]);

  return {
    themeScheme,
    navigationTheme,
    setThemeContextOverride,
    ThemeProvider: ThemeContext.Provider,
  };
};

interface UseAppThemeState {
  // theme object from react-navigation
  navTheme: typeof DefaultTheme;
  // function to set the theme context override (for switching modes)
  setThemeContextOverride: (theme: ThemeContexts) => void;
  // current theme
  theme: Theme;
  // current theme context: 'light' | 'dark';
  themeContext: ThemeContexts;
  // function to apply the theme to a style object
  themed: <TStyle>(
    styleOrStyleFn:
      | ThemedStyle<TStyle>
      | StyleProp<TStyle>
      | ThemedStyleArray<TStyle>,
  ) => TStyle;
}

/**
 * Custom hook that provides the app theme and utility functions for theming.
 *
 * @returns {UseAppThemeState} An object containing various theming values and utilities.
 * @throws {Error} If used outside of a ThemeProvider.
 */

export const useAppTheme = (): UseAppThemeState => {
  const navTheme = useNavTheme();
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }

  const { themeScheme: overrideTheme, setThemeContextOverride } = context;

  const themeContext: ThemeContexts = useMemo(
    () => overrideTheme || (navTheme.dark ? 'dark' : 'light'),
    [overrideTheme, navTheme],
  );

  const themeVariant: Theme = useMemo(
    () => toTheme(themeContext),
    [themeContext],
  );

  const themed = useCallback(
    <T>(
      styleOrStyleFn: ThemedStyle<T> | StyleProp<T> | ThemedStyleArray<T>,
    ) => {
      const flatStyles = [styleOrStyleFn].flat(3);
      const stylesArray = flatStyles.map(f => {
        if (typeof f === 'function') {
          return (f as ThemedStyle<T>)(themeVariant);
        }
        return f;
      });

      // Flatten the array of styles into a single object
      return Object.assign({}, ...stylesArray) as T;
    },
    [themeVariant],
  );

  return {
    navTheme,
    setThemeContextOverride,
    theme: themeVariant,
    themeContext,
    themed,
  };
};
