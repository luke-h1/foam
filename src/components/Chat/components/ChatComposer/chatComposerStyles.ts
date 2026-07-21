import { StyleSheet } from 'react-native';

import { type ColorScheme, theme } from '@app/styles/themes';

import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_CONTROL_SIZE,
  COMPOSER_INPUT_MIN_HEIGHT,
  COMPOSER_ROW_GAP,
} from '../composerSizing';

const createChatComposerStyles = (scheme: ColorScheme) =>
  StyleSheet.create({
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
      backgroundColor: theme.color.pressedOverlay[scheme],
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
      backgroundColor: theme.color.pressedOverlay[scheme],
      borderRadius: 20,
      color: theme.color.text[scheme],
      flex: 1,
      fontSize: 16,
      maxHeight: 120,
      minHeight: COMPOSER_INPUT_MIN_HEIGHT,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
  });

export const chatComposerStyles = {
  light: createChatComposerStyles('light'),
  dark: createChatComposerStyles('dark'),
} as const;
