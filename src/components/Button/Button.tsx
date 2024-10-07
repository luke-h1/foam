import theme from '@app/styles/theme';
import * as Haptics from 'expo-haptics';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
}

export default function Button({ onPress, title }: Props) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => {
        if (pressed) {
          return [styles.button, styles.buttonPressed];
        }
        return styles.button;
      }}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create<{
  text: TextStyle;
  button: ViewStyle;
  buttonPressed: ViewStyle;
}>({
  text: {
    color: theme.color.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: theme.color.limeGreen,
  },
  buttonPressed: {
    backgroundColor: theme.color.leafyGreen,
  },
});
