import type { PropsWithChildren, Ref } from 'react';
import type { View } from 'react-native';
import type { PressableProps } from 'react-native-gesture-handler';

export type PressableAreaProps = PropsWithChildren<PressableProps> & {
  ref?: Ref<View> | undefined;

  feedback?: 'dim' | 'highlight' | undefined;
};
