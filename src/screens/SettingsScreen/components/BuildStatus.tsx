import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { StyleSheet, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

export function BuildStatus() {
  const updateProgress = Updates.updateId ? 1 : 0.72;

  return (
    <View style={styles.buildContainer}>
      <ProgressRing
        progress={updateProgress}
        progressColor={theme.colorPrimary}
        size={28}
        strokeWidth={3}
        trackColor={theme.darkActiveContent}
      />
      <Text type='xs' color='gray.border'>
        v:{Application.nativeApplicationVersion ?? ''} (
        {Application.nativeBuildVersion ?? ''}) • OTA:{' '}
        {Updates.updateId ?? 'Embedded'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  buildContainer: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAltAlpha,
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
});

function ProgressRing({
  progress,
  progressColor,
  size = 44,
  strokeWidth = 3,
  trackColor = 'rgba(255, 255, 255, 0.15)',
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
}) {
  const normalizedProgress = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.max(0, 2 * Math.PI * radius);
  const strokeDashoffset = circumference * (1 - normalizedProgress);

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        fill='none'
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        fill='none'
        r={radius}
        stroke={progressColor}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap='round'
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}
