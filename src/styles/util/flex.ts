import { ViewStyle } from 'react-native';

export const flexDirection = (value: ViewStyle['flexDirection']) => ({
  flexDirection: value,
});

export const flexAlign = (value: ViewStyle['alignItems'] = 'center') => ({
  alignItems: value,
});

export const flexJustify = (value: ViewStyle['justifyContent'] = 'center') => ({
  justifyContent: value,
});
