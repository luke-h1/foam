import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/Text/Text';
import { theme } from '@app/styles/themes';
import { View, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
  button: {
    marginVertical: theme.space16,
  },
  buttonText: {
    backgroundColor: theme.colorDarkGreen,
    borderCurve: 'continuous',
    borderRadius: theme.space20,
    padding: theme.space20,
  },
  container: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
