import { StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

export const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    maxWidth: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  inputStickyView: {
    zIndex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  wrapper: {
    backgroundColor: theme.colorBlack,
    flex: 1,
  },
  wrapperTransparent: {
    backgroundColor: 'transparent',
  },
});
