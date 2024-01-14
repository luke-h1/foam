import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { GetProps, Stack } from 'tamagui';
import { withAnimated } from '../../hocs/withAnimated';

export const TouchableBox = TouchableOpacity;

// TSFixMe
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AnimatedTouchableBox = withAnimated(TouchableBox) as any;

export type TouchableBoxProps = GetProps<typeof Stack> & TouchableOpacityProps;
