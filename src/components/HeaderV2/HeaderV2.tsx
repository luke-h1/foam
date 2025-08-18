import { BlurView } from 'expo-blur';
import { useAppNavigation } from '@app/hooks';
import { ReactNode } from 'react';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface HeaderV2Props {
  back?: boolean;
  children: ReactNode;
  left?: ReactNode;
  right?: boolean;
  sticky?: boolean;
  title?: ReactNode;
}

export function HeaderV2({
  back,
  children,
  left,
  modal,
  right,
  sticky = true,
  title,
}: HeaderV2Props) {
  const navigation = useAppNavigation();
  const { theme } = useUnistyles();

  return (
    <BlurView
      intensity={75}
      style={styles.blurView}
      tint={
        theme.name === 'dark'
          ? 'systemThickMaterialDark'
          : 'systemThickMaterialLight'
      }
    ></BlurView>
  );
}

const styles = StyleSheet.create({
  blurView: (sticky: boolean, modal: boolean, tint: boolean) => ({}),
});
