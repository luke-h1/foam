/* eslint-disable @typescript-eslint/no-require-imports */
const {
  createRunOncePlugin,
  withAndroidManifest,
} = require('@expo/config-plugins');

/**
 * com.mikepenz.aboutlibraries.ui.LibsActivity inflates listitem_opensource.xml
 * which contains a MaterialCardView. MaterialCardView requires the host activity
 * theme to inherit from Theme.MaterialComponents. The default Expo-generated app
 * theme inherits from Theme.AppCompat/Theme.EdgeToEdge, causing an
 * IllegalArgumentException (surfaced as an InflateException) at runtime.
 *
 * This plugin scopes the fix to just LibsActivity by setting its android:theme
 * attribute to Theme.MaterialComponents.DayNight.NoActionBar, leaving the rest
 * of the app theme untouched.
 */

const LIBS_ACTIVITY = 'com.mikepenz.aboutlibraries.ui.LibsActivity';
const MATERIAL_THEME = '@style/Theme.MaterialComponents.DayNight.NoActionBar';

const withAndroidLibsActivityTheme = config => {
  return withAndroidManifest(config, config => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (!application) {
      return config;
    }

    const activities = application.activity ?? [];
    const libsActivity = activities.find(
      activity => activity.$?.['android:name'] === LIBS_ACTIVITY,
    );

    if (libsActivity) {
      libsActivity.$['android:theme'] = MATERIAL_THEME;
    } else {
      activities.push({
        $: {
          'android:name': LIBS_ACTIVITY,
          'android:theme': MATERIAL_THEME,
        },
      });
      application.activity = activities;
    }

    return config;
  });
};

module.exports = createRunOncePlugin(
  withAndroidLibsActivityTheme,
  'android-libs-activity-theme',
  '1.0.0',
);
