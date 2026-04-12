import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

export const VerticalDivider: React.FC & React.FunctionComponent = memo(
  (): (React.JSX.Element & React.ReactNode & React.ReactElement) | null => {
    return <Animated.View layout={LinearTransition} style={styles.spacer} />;
  },
);

VerticalDivider.displayName = 'VerticalDivider';

const styles = StyleSheet.create({
  spacer: {
    flex: 1,
  },
});
