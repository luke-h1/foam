import { StyleSheet } from 'react-native';

import {
  COMPOSER_CONTROL_RADIUS,
  COMPOSER_CONTROL_SIZE,
  COMPOSER_GLYPH_SIZE,
  COMPOSER_INPUT_MIN_HEIGHT,
  COMPOSER_ROW_GAP,
} from '@app/components/Chat/util/composerSizing';
import { theme } from '@app/styles/themes';

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
  pill: {
    alignItems: 'flex-end',
    backgroundColor: theme.darkActiveContent,
    borderColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: COMPOSER_CONTROL_RADIUS,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: COMPOSER_INPUT_MIN_HEIGHT,
    minWidth: 0,
    paddingRight: 6,
  },
  pillOverLimit: {
    borderColor: theme.colorRed,
  },
  inputWrapper: {
    flex: 1,
    minWidth: 0,
  },
  pillGlyphSlot: {
    alignItems: 'center',
    height: COMPOSER_GLYPH_SIZE,
    justifyContent: 'center',
    marginBottom: (COMPOSER_INPUT_MIN_HEIGHT - COMPOSER_GLYPH_SIZE) / 2 - 1,
    width: COMPOSER_GLYPH_SIZE,
  },
  submitButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: COMPOSER_CONTROL_RADIUS,
    flexShrink: 0,
    height: COMPOSER_CONTROL_SIZE,
    justifyContent: 'center',
    width: COMPOSER_CONTROL_SIZE,
  },
  characterCount: {
    alignSelf: 'flex-end',
    color: theme.color.textSecondary.dark,
    fontVariant: ['tabular-nums'],
    paddingBottom: theme.space4,
    paddingHorizontal: theme.space12,
  },
  characterCountOverLimit: {
    color: theme.colorRed,
  },
  /**
   * The RN pill paints the surface, so this must be the literal 'transparent':
   * iOS `Input` treats any other value as a surface and adds its own glass
   * over it. Its variants also derive every colour from the accent, so without
   * an explicit `color` the typed message renders in the accent.
   */
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: theme.color.text.dark,
    fontSize: 16,
    maxHeight: 120,
    minHeight: COMPOSER_INPUT_MIN_HEIGHT - 2,
    paddingHorizontal: theme.space16,
    paddingVertical: 12,
  },
});
