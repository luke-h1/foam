// import crashlytics from '@react-native-firebase/crashlytics';

export const logInfo = (message: string) => {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.info(message);
  }

  // crashlytics().log(message);
};
