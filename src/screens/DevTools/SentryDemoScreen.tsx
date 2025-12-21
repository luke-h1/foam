import { Button } from '@app/components/Button';
import { Typography } from '@app/components/Typography';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function SentryDemoScreen() {
  return (
    <View style={styles.container}>
      <Button style={[styles.buttonText, styles.button]}>
        <Typography>Log 'test error' error</Typography>
      </Button>
      <Button style={[styles.buttonText, styles.button]}>
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
    borderCurve: 'continuous',
    backgroundColor: theme.colors.accent.accent,
  },
  button: {
    marginVertical: theme.spacing.md,
  },
}));
