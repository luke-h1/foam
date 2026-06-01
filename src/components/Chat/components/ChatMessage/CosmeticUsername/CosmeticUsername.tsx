import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import { chatStore$ } from '@app/store/chatStore/state';
import { theme } from '@app/styles/themes';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import { PaintData } from '@app/utils/color/seventv-ws-service';
import { useSelector } from '@legendapp/state/react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import {
  Image,
  type StyleProp,
  TextStyle,
  View,
  StyleSheet,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { Text } from '@app/components/ui/Text/Text';
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
  /**
   * When false, omits the trailing ":" (e.g. reply preview). Default true for chat lines.
   * */
  showColon?: boolean;
  usernameTextStyle?: StyleProp<TextStyle>;
}

interface PaintedUsernameWithPaintProps {
  displayUsername: string;
  fallbackColor: string;
  paint: PaintData;
  usernameTextStyle?: StyleProp<TextStyle>;
}

function PaintedUsernameWithPaint({
  displayUsername,
  fallbackColor,
  paint,
  usernameTextStyle,
}: PaintedUsernameWithPaintProps) {
  const gradientConfig = useMemo(
    (): GradientConfig => buildGradientConfig(paint, fallbackColor),
    [paint, fallbackColor],
  );

  const shadowStyle = useMemo(() => {
    if (!paint.shadows || paint.shadows.length === 0) {
      return {};
    }

    const shadows = indexedCollectionToArray(paint.shadows);
    if (shadows.length === 0) {
      return {};
    }

    const shadow = shadows[0];
    if (!shadow) {
      return {};
    }

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

  const isRadial = paint.function === 'RADIAL_GRADIENT';
  const isAssetPaint = paint.function === 'URL' && Boolean(paint.image_url);

  const renderGradient = () => {
    if (isRadial) {
      return (
        <View style={styles.gradient}>
          <View style={styles.svgContainer}>
            <Svg width='100%' height='100%' style={styles.svgGradient}>
              <Defs>
                <SvgRadialGradient
                  id='radialPaint'
                  cx='50%'
                  cy='50%'
                  rx='50%'
                  ry='50%'
                  fx='50%'
                  fy='50%'
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
                x='0'
                y='0'
                width='100%'
                height='100%'
                fill='url(#radialPaint)'
              />
            </Svg>
          </View>
          {/* Invisible text to size the gradient correctly */}
          <Text style={[styles.hiddenText, usernameTextStyle, shadowStyle]}>
            {displayUsername}
          </Text>
        </View>
      );
    }

    if (isAssetPaint) {
      return (
        <View style={styles.gradient}>
          <View style={styles.svgContainer}>
            <Image
              resizeMode={paint.repeat ? 'repeat' : 'cover'}
              source={{ uri: paint.image_url }}
              style={styles.assetPaintImage}
            />
          </View>
          <Text style={[styles.hiddenText, usernameTextStyle, shadowStyle]}>
            {displayUsername}
          </Text>
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
        <Text style={[styles.hiddenText, usernameTextStyle, shadowStyle]}>
          {displayUsername}
        </Text>
      </LinearGradient>
    );
  };

  return (
    <MaskedView
      maskElement={
        <View style={styles.maskContainer}>
          <Text style={[styles.maskText, usernameTextStyle, shadowStyle]}>
            {displayUsername}
          </Text>
        </View>
      }
    >
      {renderGradient()}
    </MaskedView>
  );
}

function PaintedUsernameComponent({
  username,
  paint: paintProp,
  userId,
  fallbackColor = '#FFFFFF',
  showColon = true,
  usernameTextStyle,
}: PaintedUsernameProps) {
  const displayUsername = showColon ? `${username}: ` : username;
  const storePaint = useSelector(() => {
    if (!userId) {
      return null;
    }

    const paintId = chatStore$.userPaintIds[userId]?.get();
    return paintId ? chatStore$.paints[paintId]?.get() : null;
  });
  const paint = paintProp ?? storePaint ?? null;

  if (!paint) {
    return (
      <Text
        style={[
          styles.plainUsername,
          { color: fallbackColor },
          usernameTextStyle,
        ]}
      >
        {displayUsername}
      </Text>
    );
  }

  return (
    <PaintedUsernameWithPaint
      displayUsername={displayUsername}
      fallbackColor={fallbackColor}
      paint={paint}
      usernameTextStyle={usernameTextStyle}
    />
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
  },
  hiddenText: {
    fontSize: theme.fontSize14,
    fontWeight: 'bold',
    opacity: 0,
  },
  maskContainer: {
    backgroundColor: 'transparent',
  },
  maskText: {
    color: 'black',
    fontSize: theme.fontSize14,
    fontWeight: 'bold',
  },
  plainUsername: {
    fontSize: theme.fontSize14,
    fontWeight: 'bold',
  },
  svgContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  svgGradient: {
    position: 'absolute',
  },
  assetPaintImage: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

export const PaintedUsername = memo(PaintedUsernameComponent);
PaintedUsername.displayName = 'PaintedUsername';
