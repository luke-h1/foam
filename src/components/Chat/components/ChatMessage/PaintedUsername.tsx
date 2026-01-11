import {
  PaintData,
  IndexedCollection,
  PaintStop,
} from '@app/services/ws/seventv-ws-service';
import { chatStore$ } from '@app/store/chatStore';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import { View } from 'react-native';
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
 * Convert a 7TV integer color to a CSS rgba string
 * 7TV colors are stored as signed 32-bit integers in RGBA format
 */
function intToRgba(color: number): string {
  const unsigned = Math.abs(color);

  const r = Math.floor(unsigned / 0x1000000) % 0x100;
  const g = Math.floor(unsigned / 0x10000) % 0x100;
  const b = Math.floor(unsigned / 0x100) % 0x100;
  const a = (unsigned % 0x100) / 255;

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

function indexedCollectionToArray<T>(collection: IndexedCollection<T>): T[] {
  const result: T[] = [];
  for (let i = 0; i < collection.length; i += 1) {
    if (collection[i] !== undefined) {
      result.push(collection[i] as T);
    }
  }
  return result;
}

/**
 * Calculate gradient start and end points based on angle
 * 0 degrees = left to right, 90 degrees = bottom to top
 */
function angleToPoints(angle: number): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  // Convert angle to radians and adjust for CSS gradient direction
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

  const { colors, locations, start, end } = useMemo(() => {
    if (!paint) {
      return {
        colors: [fallbackColor, fallbackColor],
        locations: [0, 1],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
      };
    }
    if (paint.function === 'URL' || !paint.stops || paint.stops.length === 0) {
      const solidColor =
        paint.color !== null ? intToRgba(paint.color) : fallbackColor;
      return {
        colors: [solidColor, solidColor],
        locations: [0, 1],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 0 },
      };
    }

    const stops = indexedCollectionToArray<PaintStop>(paint.stops);

    const sortedStops = [...stops].sort((a, b) => a.at - b.at);

    const gradientColors = sortedStops.map(stop => intToRgba(stop.color));
    const gradientLocations = sortedStops.map(stop => stop.at);

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
  }, [paint, fallbackColor]);

  const shadowStyle = useMemo(() => {
    if (!paint || !paint.shadows || paint.shadows.length === 0) {
      return {};
    }

    const shadows = indexedCollectionToArray(paint.shadows);
    if (shadows.length === 0) return {};

    const shadow = shadows[0];
    const shadowColor = intToRgba(shadow?.color as number);

    return {
      textShadowColor: shadowColor,
      textShadowOffset: {
        width: shadow?.x_offset || 0,
        height: shadow?.y_offset || 0,
      },
      textShadowRadius: shadow?.radius || 0,
    };
  }, [paint]);

  return (
    <MaskedView
      maskElement={
        <View style={styles.maskContainer}>
          <Text style={[styles.maskText, shadowStyle]}>{username}:</Text>
        </View>
      }
    >
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        locations={locations as [number, number, ...number[]]}
        start={start}
        end={end}
        style={styles.gradient}
      >
        {/* Invisible text to size the gradient correctly */}
        <Text style={[styles.hiddenText, shadowStyle]}>{username}:</Text>
      </LinearGradient>
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
}));

export const PaintedUsername = memo(PaintedUsernameComponent);
PaintedUsername.displayName = 'PaintedUsername';
