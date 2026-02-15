import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function SentryDemoScreen() {
  return (
    <View style={styles.container}>
      <Button style={[styles.buttonText, styles.button]}>
        <Text>Log 'test error' error</Text>
      </Button>
      <Button style={[styles.buttonText, styles.button]}>
        <Text>Log 'test_event' event</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
  },
  buttonText: {
    padding: theme.spacing.lg,
    borderRadius: theme.spacing.lg,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.accent.accent,
  },
  button: {
    marginVertical: theme.spacing.md,
  },
}));
