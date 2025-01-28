/* eslint-disable no-console */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function purgeAsyncStorage() {
  try {
    await AsyncStorage.clear();
    console.log('AsyncStorage successfully cleared.');
  } catch (error) {
    console.error('Failed to clear AsyncStorage:', error);
  }
}
