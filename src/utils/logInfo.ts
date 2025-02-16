import newRelic from 'newrelic-react-native-agent';

export const logInfo = (message: string) => {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.info(message);
  }

  newRelic.log('info', message);
};
