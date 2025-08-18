import { useAppNavigation } from '@app/hooks';
import { BlurView } from 'expo-blur';
import { UnistylesValues } from 'node_modules/react-native-unistyles/lib/typescript/src/types';
import { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { IconButton } from '../IconButton';
import { Typography } from '../Typography';

export interface HeaderV2Props {
  back?: boolean;
  children: ReactNode;
  left?: ReactNode;
  modal?: boolean;
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
      // @ts-expect-error - need to sort
      style={styles.blurView(sticky, Boolean(modal), true)}
      tint={
        theme.name === 'dark'
          ? 'systemThickMaterialDark'
          : 'systemThickMaterialLight'
      }
    >
      <View style={styles.wrapper}>
        {(left ?? back) ? (
          <View style={[styles.actions, styles.left]}>
            {back ? (
              <IconButton
                label={modal ? 'close' : 'goBack'}
                onPress={() => navigation.goBack()}
                icon={modal ? 'x' : 'arrowLeft'}
              />
            ) : null}
            {left}
          </View>
        ) : null}

        {typeof title === 'string' ? (
          <Typography numberOfLines={1} style={styles.title} fontWeight="bold">
            {title}
          </Typography>
        ) : (
          <View style={styles.titleWrapper}>{title}</View>
        )}
        {right ? (
          <View style={[styles.actions, styles.right]}>{right}</View>
        ) : null}
      </View>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  blurView: (sticky: boolean, modal: boolean, tint: boolean) => {
    const base: UnistylesValues = {
      backgroundColor: theme.colors[tint ? 'accent' : 'gray'].bgAlpha,
      borderBottomColor: 'transparent',
      borderBottomWidth: StyleSheet.hairlineWidth,
    };

    if (modal) {
      return {
        ...base,
        backgroundColor: theme.colors[tint ? 'accent' : 'gray'].bg,
      };
    }

    if (sticky) {
      return {
        ...base,
        left: 0,
        paddingTop: rt.insets.top,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 100,
      };
    }

    return {
      ...base,
      paddingTop: rt.insets.top,
    };
  },
  right: {
    right: 0,
  },
  title: {
    maxWidth: '50%',
  },
  wrapper: {
    alignItems: 'center',
    height: theme.spacing.md,
    justifyContent: 'center',
  },
  titleWrapper: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actions: {
    bottom: 0,
    position: 'absolute',
    flexDirection: 'row',
  },
  left: {
    left: 0,
  },
}));
