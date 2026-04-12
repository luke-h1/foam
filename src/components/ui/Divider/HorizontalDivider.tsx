import { logger } from '@app/utils/logger';
import React, {
  Children,
  FC,
  Fragment,
  FunctionComponent,
  memo,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useMemo,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const HEIGHT = 30;
const WIDTH = 2.3;
const BORDER_RADIUS = 10;
const MARGIN = 15;

interface HorizontalDividerProps extends PropsWithChildren {
  readonly height?: number;
  readonly width?: number;
  readonly color?: string;
}

export const HorizontalDivider: FC<HorizontalDividerProps> &
  FunctionComponent<HorizontalDividerProps> = memo<HorizontalDividerProps>(
  ({
    children,
    color,
    height,
    width,
  }: HorizontalDividerProps):
    | (React.JSX.Element & ReactNode & ReactElement)
    | null => {
    const validChildren = Children.toArray(children);

    const lineStyle = useMemo<ViewStyle>(
      () => ({
        width: width ?? WIDTH,
        height: height ?? HEIGHT,
        backgroundColor: color ?? '#7d7d7d',
      }),
      [color, height, width],
    );

    const segmentStyle = useMemo<StyleProp<ViewStyle>>(
      () => [styles.segment, lineStyle],
      [lineStyle],
    );

    if (validChildren.length < 2) {
      logger.main.warn('HorizontalDivider must have at least 2 children');
      // eslint-disable-next-line react/jsx-no-useless-fragment
      return <>{children}</>;
    }

    return (
      <View style={styles.container}>
        {validChildren.map<ReactNode>(
          (child, index): ReactNode => (
            // eslint-disable-next-line react/no-array-index-key
            <Fragment key={index}>
              {index > 0 && <View style={segmentStyle} />}
              {child}
            </Fragment>
          ),
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  segment: {
    borderCurve: 'continuous',
    borderRadius: BORDER_RADIUS,
    margin: MARGIN,
  },
});

HorizontalDivider.displayName = 'HorizontalDivider';
