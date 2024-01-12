import { createAnimations } from '@tamagui/animations-react-native';
import { createInterFont } from '@tamagui/font-inter';
import { createMedia } from '@tamagui/react-native-media-driver';
import { shorthands } from '@tamagui/shorthands';
import { createTamagui } from 'tamagui';
import { themes } from './src/styles';
import { tokens } from './src/styles/tokens';

const animations = createAnimations({
  '100ms': {
    type: 'timing',
    duration: 100,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },
  slow: {
    damping: 15,
    stiffness: 40,
  },
  tooltip: {
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
});

const headingFont = createInterFont();
const bodyFont = createInterFont();

const config = createTamagui({
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  defaultFont: 'body',
  animations,
  shorthands,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  tokens,
  themes,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { maxWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { maxWidth: 1020 + 1 },
    gtLg: { maxWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
  settings: {
    fastSchemeChange: true,
    autocompleteSpecificTokens: true,
  },
});

export default config;
