import { createAnimations } from '@tamagui/animations-react-native';
import { createMedia } from '@tamagui/react-native-media-driver';
import { shorthands as tamaguiShorthands } from '@tamagui/shorthands';
import { createTamagui } from 'tamagui';
import {
  breakpoints,
  themes,
  bodyFont,
  buttonFont,
  headingFont,
  subHeadingFont,
  heightBreakpoints,
} from './src/styles';
import { tokens } from './src/styles/tokens';

const {
  // tamagui has this terribly awkward bc that is the same as bg :/, removing it for our purposes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bc,
  ...shorthands
} = tamaguiShorthands;

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

const config = createTamagui({
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  defaultFont: 'body',
  animations,
  shorthands,
  fonts: {
    heading: headingFont,
    subHeading: subHeadingFont,
    body: bodyFont,
    button: buttonFont,
  },
  tokens,
  themes,
  media: createMedia({
    xxs: { maxWidth: breakpoints.xxs },
    xs: { maxWidth: breakpoints.xs },
    sm: { maxWidth: breakpoints.sm },
    md: { maxWidth: breakpoints.md },
    lg: { maxWidth: breakpoints.lg },
    xl: { maxWidth: breakpoints.xl },
    xxl: { maxWidth: breakpoints.xxl },
    xxxl: { maxWidth: breakpoints.xxxl },
    short: { maxHeight: heightBreakpoints.short },
  }),
  settings: {
    fastSchemeChange: true,
    allowedStyleValues: 'somewhat-strict-web',
    autocompleteSpecificTokens: 'except-special',
  },
});

export default config;
