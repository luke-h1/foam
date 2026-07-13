import { Platform, StyleSheet } from 'react-native';

import { theme } from '@app/styles/themes';

const MENU_BACKGROUND = theme.color.menu.background;
const MENU_HEADER_BACKGROUND = theme.color.menu.header;
const MENU_CARD_ACTIVE = theme.color.menu.cardActive;
const MENU_BORDER = theme.color.menu.border;

/**
 * iOS lets the sheet's native blur/glass material show through; Android has
 * no sheet material, so surfaces stay solid there.
 */
const SHEET_SURFACE = Platform.OS === 'ios' ? 'transparent' : MENU_BACKGROUND;
const SHEET_HEADER_SURFACE =
  Platform.OS === 'ios' ? 'transparent' : MENU_HEADER_BACKGROUND;

export const emoteSheetStyles = StyleSheet.create({
  body: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    width: '100%',
  },
  categoryBar: {
    alignItems: 'center',
    backgroundColor: SHEET_HEADER_SURFACE,
    borderTopColor: MENU_BORDER,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingTop: theme.space8,
    width: '100%',
  },
  categoryBarContent: {
    alignItems: 'center',
    gap: theme.space8,
    paddingHorizontal: theme.space12,
  },
  container: {
    alignSelf: 'stretch',
    backgroundColor: SHEET_SURFACE,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    width: '100%',
  },
  emojiText: {
    lineHeight: undefined,
  },
  emoteCell: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    justifyContent: 'center',
    padding: 3,
  },
  emoteRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'flex-start',
    paddingVertical: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space28,
    paddingTop: theme.space56,
  },
  emptyStateBody: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize14,
    marginTop: theme.space12,
    textAlign: 'center',
  },
  emptyStateTitle: {
    fontSize: theme.fontSize18,
    fontWeight: '700',
  },
  header: {
    backgroundColor: SHEET_HEADER_SURFACE,
    borderBottomColor: MENU_BORDER,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingBottom: theme.space8,
    position: 'relative',
    width: '100%',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space36,
    paddingHorizontal: 16,
    paddingTop: theme.space4,
  },
  placeholderContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 420,
  },
  providerBar: {
    maxHeight: 54,
  },
  providerBarContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  providerChip: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: 18,
    flexDirection: 'row',
    gap: theme.space8,
    height: 36,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: theme.space12,
    position: 'relative',
  },
  providerChipActive: {
    backgroundColor: 'rgba(120, 120, 128, 0.32)',
    minWidth: 88,
    paddingHorizontal: theme.space16,
  },
  providerChipIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerChipTitle: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '600',
  },
  searchContainer: {
    justifyContent: 'center',
    marginTop: theme.space8,
    paddingHorizontal: theme.space16,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchInputWrap: {
    alignItems: 'center',
    /**
     * UISearchTextField dark-mode fill.
     */
    backgroundColor: 'rgba(118, 118, 128, 0.24)',
    borderCurve: 'continuous',
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 36,
    paddingHorizontal: theme.space8,
  },
  searchInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize16,
    fontWeight: '400',
    height: 36,
    minHeight: 36,
    paddingHorizontal: 0,
  },
  searchIcon: {
    color: theme.color.textSecondary.dark,
    opacity: 0.7,
  },
  searchClearButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.24)',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  searchClearButtonHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  setHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    marginBottom: theme.space4,
    marginTop: theme.space8,
    minHeight: 36,
    paddingHorizontal: theme.space4,
    paddingVertical: theme.space4,
  },
  setHeaderIcon: {
    alignItems: 'center',
    borderRadius: 4,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  setHeaderTitle: {
    color: theme.color.textSecondary.dark,
    flex: 1,
    fontSize: theme.fontSize12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  setRailAvatar: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  setRailAvatarContainer: {
    borderRadius: 12,
    height: 24,
    overflow: 'hidden',
    width: 24,
  },
  setRailButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: 16,
    height: 40,
    justifyContent: 'center',
    minWidth: 40,
    paddingHorizontal: theme.space8,
  },
  setRailButtonActive: {
    backgroundColor: MENU_CARD_ACTIVE,
  },
  setRailEmoji: {
    fontSize: theme.fontSize16,
  },
  setRailLabel: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: theme.fontSize12,
    fontWeight: '600',
    textAlign: 'center',
  },
  setRailLabelActive: {
    color: theme.color.text.dark,
  },
});
