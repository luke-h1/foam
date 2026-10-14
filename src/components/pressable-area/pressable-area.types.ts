import type { PropsWithChildren, Ref } from 'react';
import type { View } from 'react-native';
import type { PressableProps } from 'react-native-gesture-handler';

export type PressableAreaProps = PropsWithChildren<PressableProps> & {
  ref?: Ref<View>;

  /**
   * `highlight` fills the row background while pressed instead of dimming the
   * content. Use it for full-bleed list rows. Android shows its ripple for
   * both.
   */
  feedback?: 'dim' | 'highlight';
};
