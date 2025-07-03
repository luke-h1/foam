import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const statusBarHeight =
  Platform.OS === 'android' ? Constants.statusBarHeight : 0;
