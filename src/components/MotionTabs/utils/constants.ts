import { Easing, type EasingFunctionFactory } from 'react-native-reanimated';

const EASING: EasingFunctionFactory = Easing.bezier(0.22, 1, 0.36, 1);
const DURATION = 600;
const ICON_BOX = 48;
const LABEL_PAD = 18;
const TAB_HEIGHT = 44;

export { DURATION, EASING, ICON_BOX, LABEL_PAD, TAB_HEIGHT };
