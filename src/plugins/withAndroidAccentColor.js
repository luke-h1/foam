/* eslint-disable @typescript-eslint/no-require-imports */
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
} = require('@expo/config-plugins');

/**
 * The generated AppTheme keeps Expo's template colorPrimary and the AppCompat
 * default teal colorAccent, so native widget accents - TextInput cursors,
 * selection handles, and the selection highlight - render off-brand on every
 * Android text field. Pin both to the app accent, split per scheme to match
 * `primaryAccent` in src/styles/themes.ts (Theme.EdgeToEdge is DayNight-based,
 * so values-night applies in dark mode).
 */
const LIGHT_ACCENT_COLOR = '#1083FE';
const DARK_ACCENT_COLOR = '#2E86FF';

const assignAccentColors = (colors, value) => {
  colors = AndroidConfig.Colors.assignColorValue(colors, {
    name: 'colorAccent',
    value,
  });
  return AndroidConfig.Colors.assignColorValue(colors, {
    name: 'colorPrimary',
    value,
  });
};

const withAndroidAccentColor = config => {
  config = withAndroidColors(config, configWithColors => {
    configWithColors.modResults = assignAccentColors(
      configWithColors.modResults,
      LIGHT_ACCENT_COLOR,
    );
    return configWithColors;
  });

  config = withAndroidColorsNight(config, configWithColors => {
    configWithColors.modResults = assignAccentColors(
      configWithColors.modResults,
      DARK_ACCENT_COLOR,
    );
    return configWithColors;
  });

  return withAndroidStyles(config, configWithStyles => {
    configWithStyles.modResults = AndroidConfig.Styles.assignStylesValue(
      configWithStyles.modResults,
      {
        add: true,
        name: 'colorAccent',
        value: '@color/colorAccent',
        /**
         * Match AppTheme by name only; matching on name + parent creates a
         * duplicate <style> group (AAPT2 build failure) the moment the
         * template's parent theme changes.
         */
        parent: AndroidConfig.Styles.getAppThemeGroup(),
      },
    );
    return configWithStyles;
  });
};

module.exports = createRunOncePlugin(
  withAndroidAccentColor,
  'android-accent-color',
  '1.0.0',
);
