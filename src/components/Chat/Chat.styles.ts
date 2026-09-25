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
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  resumeScrollLift: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  wrapper: {
    backgroundColor: theme.colorBlack,
    flex: 1,
  },
  wrapperTransparent: {
    backgroundColor: 'transparent',
  },
});
