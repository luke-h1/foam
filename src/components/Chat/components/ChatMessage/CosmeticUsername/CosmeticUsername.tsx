import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import { chatStore$ } from '@app/store/chatStore';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import { PaintData } from '@app/utils/color/seventv-ws-service';
import { useSelector } from '@legendapp/state/react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '../../../../Text/Text';
import {
  buildGradientConfig,
  GradientConfig,
} from './util/buildGradientConfig';

interface PaintedUsernameProps {
  username: string;
  /**
   * Paint cosmetics - if not provided it gets looked up from store by the userId
   */
  paint?: PaintData;

  /**
   * Twitch User ID - used to look up from store if paint data is not provided
   */
  userId?: string;
  fallbackColor?: string;
}

function PaintedUsernameComponent({
  username,
  paint: paintProp,
  userId,
  fallbackColor = '#FFFFFF',
}: PaintedUsernameProps) {
  const paintId = useSelector(() =>
    userId ? chatStore$.userPaintIds[userId]?.get() : null,
  );
  const storePaint = useSelector(() =>
    paintId ? chatStore$.paints[paintId]?.get() : null,
  );

  const paint = useMemo(() => {
    if (paintProp) return paintProp;
    return storePaint ?? null;
  }, [paintProp, storePaint]);

  const gradientConfig = useMemo((): GradientConfig => {
    if (!paint) {
      return {
        colors: [fallbackColor, fallbackColor],
        locations: [0, 1],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
      };
    }

    return buildGradientConfig(paint, fallbackColor);
  }, [paint, fallbackColor]);

  const shadowStyle = useMemo(() => {
    if (!paint || !paint.shadows || paint.shadows.length === 0) {
      return {};
    }

    const shadows = indexedCollectionToArray(paint.shadows);
    if (shadows.length === 0) return {};

    const shadow = shadows[0];
    if (!shadow) return {};

    const shadowColor = sevenTvColorToCss(shadow.color);

    return {
      textShadowColor: shadowColor,
      textShadowOffset: {
        width: shadow.x_offset || 0,
        height: shadow.y_offset || 0,
      },
      textShadowRadius: shadow.radius || 0,
    };
  }, [paint]);

  const isRadial = paint?.function === 'RADIAL_GRADIENT';

  const renderGradient = () => {
    if (isRadial) {
      return (
        <View style={styles.gradient}>
          <View style={styles.svgContainer}>
            <Svg width="100%" height="100%" style={styles.svgGradient}>
              <Defs>
                <SvgRadialGradient
                  id="radialPaint"
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                  fx="50%"
                  fy="50%"
                >
                  {gradientConfig.colors.map((color, index) => (
                    <Stop
                      key={`${color}-${gradientConfig.locations[index]}`}
                      offset={`${(gradientConfig.locations[index] ?? 0) * 100}%`}
                      stopColor={color}
                    />
                  ))}
                </SvgRadialGradient>
              </Defs>
              <Rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="url(#radialPaint)"
              />
            </Svg>
          </View>
          {/* Invisible text to size the gradient correctly */}
          <Text style={[styles.hiddenText, shadowStyle]}>{username}:</Text>
        </View>
      );
    }

    return (
      <LinearGradient
        colors={gradientConfig.colors as [string, string, ...string[]]}
        locations={gradientConfig.locations as [number, number, ...number[]]}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={styles.gradient}
      >
        {/* Invisible text to size the gradient correctly */}
        <Text style={[styles.hiddenText, shadowStyle]}>{username}:</Text>
      </LinearGradient>
    );
  };

  return (
    <MaskedView
      maskElement={
        <View style={styles.maskContainer}>
          <Text style={[styles.maskText, shadowStyle]}>{username}:</Text>
        </View>
      }
    >
      {renderGradient()}
    </MaskedView>
  );
}

const styles = StyleSheet.create(theme => ({
  maskContainer: {
    backgroundColor: 'transparent',
  },
  maskText: {
    fontWeight: 'bold',
    fontSize: theme.font.fontSize.sm,
    color: 'black',
  },
  gradient: {
    flexDirection: 'row',
  },
  hiddenText: {
    fontWeight: 'bold',
    fontSize: theme.font.fontSize.sm,
    opacity: 0,
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  svgGradient: {
    position: 'absolute',
  },
}));

export const PaintedUsername = memo(PaintedUsernameComponent);
PaintedUsername.displayName = 'PaintedUsername';
