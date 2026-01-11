import {
  PaintData,
  PaintStop,
  sevenTvColorToCss,
  indexedCollectionToArray,
} from '@app/services/ws/seventv-ws-service';
import { chatStore$ } from '@app/store/chatStore';
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
import { Text } from '../../../Text';

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

/**
 * Calculate gradient start and end points based on angle
 * CSS gradient angles: 0deg = bottom to top, 90deg = left to right
 * We convert to expo-linear-gradient's coordinate system
 */
function angleToPoints(angle: number): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  // Convert CSS angle to radians
  // CSS: 0deg = bottom to top, clockwise positive
  // We need to convert to coordinate points where (0,0) is top-left
  const rad = ((angle - 90) * Math.PI) / 180;

  const x1 = 0.5 + 0.5 * Math.cos(rad + Math.PI);
  const y1 = 0.5 + 0.5 * Math.sin(rad + Math.PI);
  const x2 = 0.5 + 0.5 * Math.cos(rad);
  const y2 = 0.5 + 0.5 * Math.sin(rad);

  return {
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
  };
}

interface GradientConfig {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Build gradient configuration from paint data
 */
function buildGradientConfig(
  paint: PaintData,
  fallbackColor: string,
): GradientConfig {
  // Handle URL paints or empty stops - use solid color
  if (paint.function === 'URL' || !paint.stops || paint.stops.length === 0) {
    const solidColor =
      paint.color !== null ? sevenTvColorToCss(paint.color) : fallbackColor;
    return {
      colors: [solidColor, solidColor],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    };
  }

  const stops = indexedCollectionToArray<PaintStop>(paint.stops);
  const sortedStops = [...stops].sort((a, b) => a.at - b.at);

  const gradientColors = sortedStops.map(stop => sevenTvColorToCss(stop.color));
  const gradientLocations = sortedStops.map(stop => stop.at);

  // Need at least 2 stops for a gradient
  if (gradientColors.length < 2) {
    const color = gradientColors[0] || fallbackColor;
    return {
      colors: [color, color],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    };
  }

  const points = angleToPoints(paint.angle || 0);

  return {
    colors: gradientColors,
    locations: gradientLocations,
    start: points.start,
    end: points.end,
  };
}

function PaintedUsernameComponent({
  username,
  paint: paintProp,
  userId,
  fallbackColor = '#FFFFFF',
}: PaintedUsernameProps) {
  const paint = useMemo(() => {
    if (paintProp) return paintProp;
    if (!userId) return null;

    const paintId = chatStore$.userPaintIds[userId]?.peek();
    if (!paintId) return null;

    return chatStore$.paints[paintId]?.peek() ?? null;
  }, [paintProp, userId]);

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
