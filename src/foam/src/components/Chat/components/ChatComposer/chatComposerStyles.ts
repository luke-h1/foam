import { StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_CONTROL_SIZE,
  COMPOSER_INPUT_MIN_HEIGHT,
  COMPOSER_ROW_GAP,
} from '../composerSizing';

export const chatComposerStyles = StyleSheet.create({
  mainContainer: {
    position: 'relative',
    width: '100%',
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: COMPOSER_ROW_GAP,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderRadius: COMPOSER_CONTROL_RADIUS,
    height: COMPOSER_CONTROL_SIZE,
    justifyContent: 'center',
    width: COMPOSER_CONTROL_SIZE,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: COMPOSER_CONTROL_RADIUS,
    height: COMPOSER_CONTROL_SIZE,
    justifyContent: 'center',
    width: COMPOSER_CONTROL_SIZE,
  },
  input: {
    backgroundColor: theme.darkActiveContent,
    borderRadius: 20,
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    minHeight: COMPOSER_INPUT_MIN_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
