import { Button, Typography } from '@app/components';
import newRelic from 'newrelic-react-native-agent';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function NewRelicDemoScreen() {
  return (
    <View style={styles.container}>
      <Button
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onPress={() =>
          newRelic.recordError(new Error('NewRelicDemo test error'))
        }
        style={[styles.buttonText, styles.button]}
      >
        <Typography>Log 'test error' error</Typography>
      </Button>
      <Button
        onPress={() =>
          newRelic.recordCustomEvent('analytics', 'test', new Map())
        }
        style={[styles.buttonText, styles.button]}
      >
        <Typography>Log 'test_event' event</Typography>
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
    backgroundColor: theme.colors.borderFaint,
  },
  button: {
    marginVertical: theme.spacing.md,
  },
}));
