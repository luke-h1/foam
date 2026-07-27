/* eslint-disable @typescript-eslint/no-require-imports */
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidColors,
  withAndroidStyles,
} = require('@expo/config-plugins');

/**
 * The generated AppTheme keeps Expo's template colorPrimary and the AppCompat
 * default teal colorAccent, so native widget accents - TextInput cursors,
 * selection handles, and the selection highlight - render off-brand on every
 * Android text field. Pin both to the app accent (theme.colorPrimary).
 */
const ACCENT_COLOR = '#2E86FF';

const withAndroidAccentColor = config => {
  config = withAndroidColors(config, configWithColors => {
    configWithColors.modResults = AndroidConfig.Colors.assignColorValue(
      configWithColors.modResults,
      { name: 'colorAccent', value: ACCENT_COLOR },
    );
    configWithColors.modResults = AndroidConfig.Colors.assignColorValue(
      configWithColors.modResults,
      { name: 'colorPrimary', value: ACCENT_COLOR },
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
        parent: {
          name: 'AppTheme',
          parent: 'Theme.EdgeToEdge',
        },
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
