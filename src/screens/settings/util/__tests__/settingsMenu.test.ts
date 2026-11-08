import type { SettingsMenuRow } from '../settingsMenu';

const originalVariant = process.env.EXPO_PUBLIC_APP_VARIANT;

function devtoolsRouteLabels(
  variant: typeof process.env.EXPO_PUBLIC_APP_VARIANT,
): string[] {
  process.env.EXPO_PUBLIC_APP_VARIANT = variant;

  let rows: SettingsMenuRow[] = [];

  jest.isolateModules(() => {
    rows = require('../settingsMenu').DEVTOOLS_ROUTES;
  });

  return rows.map(row => row.label);
}

afterEach(() => {
  process.env.EXPO_PUBLIC_APP_VARIANT = originalVariant;
});

describe('DEVTOOLS_ROUTES', () => {
  test('lists Storybook in a dev-tools build', () => {
    expect(devtoolsRouteLabels('development')).toContain('Storybook');
  });

  test('leaves out Storybook in a production build, where the route redirects', () => {
    expect(devtoolsRouteLabels('production')).not.toContain('Storybook');
  });
});
