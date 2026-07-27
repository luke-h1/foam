/* eslint-disable @typescript-eslint/no-require-imports */
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
} = require('@expo/config-plugins');

/**
 * The generated AppTheme keeps the AppCompat default teal accent, so cursors and
 * selection handles render off-brand in every Android text field. Split per
 * scheme (Theme.EdgeToEdge is DayNight-based, so values-night covers dark mode).
 *
 * Config plugins run in bare node at prebuild and cannot import the TS theme, so
 * these must be kept in sync by hand with `primaryAccent` in src/styles/themes.ts.
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
        // name-only match; name+parent duplicates the style group when the
        // template's parent theme changes
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
