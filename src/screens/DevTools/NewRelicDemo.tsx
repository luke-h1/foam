import { Button, Screen, Typography } from '@app/components';
import { useAppNavigation, useHeader } from '@app/hooks';
import newRelic from 'newrelic-react-native-agent';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

export function NewRelicDemoScreen() {
  const { styles } = useStyles(stylesheet);
  const { goBack } = useAppNavigation();
  useHeader({
    title: 'New Relic demo',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });
  return (
    <Screen>
      <View style={styles.container}>
        <Button
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
    </Screen>
  );
}

const stylesheet = createStyleSheet(theme => ({
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
