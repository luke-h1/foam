import { StyleSheet } from 'react-native';
import { theme } from '@app/styles/themes';
import { CHAT_SHEET_BACKGROUND } from '../chatSheetSurface';
import {
  EMOTE_SHEET_CELL_GAP,
  EMOTE_SHEET_GRID_PADDING,
  EMOTE_SHEET_PROVIDER_BAR_HEIGHT,
  EMOTE_SHEET_RAIL_WIDTH,
  EMOTE_SHEET_SEARCH_BAR_HEIGHT,
} from './emoteSheetLayout';

const CELL_GAP = EMOTE_SHEET_CELL_GAP;
const GRID_HORIZONTAL_PADDING = EMOTE_SHEET_GRID_PADDING;
const RAIL_WIDTH = EMOTE_SHEET_RAIL_WIDTH;
const PROVIDER_BAR_HEIGHT = EMOTE_SHEET_PROVIDER_BAR_HEIGHT;
const SEARCH_BAR_HEIGHT = EMOTE_SHEET_SEARCH_BAR_HEIGHT;
const MENU_HEADER_BACKGROUND = '#111215';
const MENU_ACTIVE_SURFACE = '#2b2d33';
const MENU_BORDER = 'rgba(255, 255, 255, 0.075)';
const MENU_MUTED_TEXT = 'rgba(255, 255, 255, 0.62)';
const MENU_SURFACE = '#1f2025';

export const emoteSheetStyles = StyleSheet.create({
  body: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    width: '100%',
  },
  container: {
    alignSelf: 'stretch',
    backgroundColor: CHAT_SHEET_BACKGROUND,
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  contentPane: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
  },
  sheetHandle: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderRadius: 999,
    height: 4,
    width: 36,
  },
  sheetHandleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    paddingTop: 8,
    width: '100%',
  },
  emojiIconText: {
    fontSize: theme.fontSize18,
  },
  emojiText: {
    lineHeight: undefined,
  },
  emoteCell: {
    alignItems: 'center',
    backgroundColor: '#15161a',
    borderColor: 'rgba(255,255,255,0.035)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    padding: 3,
  },
  emoteCellInner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoteImage: {
    alignSelf: 'center',
  },
  emoteImageContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoteImageLoading: {
    opacity: 0,
  },
  emoteImagePlaceholder: {
    backgroundColor: '#202127',
    borderColor: 'rgba(255,255,255,0.055)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  emoteImageShimmer: {
    opacity: 0.9,
  },
  emoteRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
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
  fallbackIconLabel: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    fontWeight: '800',
    letterSpacing: 0,
  },
  ffzTextIcon: {
    color: theme.colorPrimary,
    letterSpacing: 0,
  },
  ffzTextIconActive: {
    color: theme.color.text.dark,
  },
  header: {
    backgroundColor: MENU_HEADER_BACKGROUND,
    borderBottomColor: MENU_BORDER,
    borderBottomWidth: 1,
    minHeight: PROVIDER_BAR_HEIGHT + SEARCH_BAR_HEIGHT,
    overflow: 'hidden',
    paddingBottom: theme.space8,
    position: 'relative',
    width: '100%',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: theme.space36,
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingTop: theme.space4,
  },
  placeholderContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 420,
  },
  providerBar: {
    maxHeight: PROVIDER_BAR_HEIGHT,
  },
  providerBarContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  providerChip: {
    alignItems: 'center',
    backgroundColor: '#191a1f',
    borderColor: 'rgba(255,255,255,0.055)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space8,
    height: 38,
    justifyContent: 'center',
    minWidth: 40,
    paddingHorizontal: theme.space12,
    position: 'relative',
  },
  providerChipActive: {
    backgroundColor: MENU_ACTIVE_SURFACE,
    borderColor: 'rgba(255,255,255,0.14)',
    minWidth: 88,
    paddingHorizontal: theme.space12,
  },
  providerChipIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerChipTitle: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '700',
  },
  rail: {
    backgroundColor: MENU_HEADER_BACKGROUND,
    borderLeftColor: MENU_BORDER,
    borderLeftWidth: 1,
    flexShrink: 0,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    width: RAIL_WIDTH,
  },
  railContent: {
    alignItems: 'center',
    paddingBottom: theme.space28,
    paddingHorizontal: theme.space4,
    paddingTop: theme.space8,
    width: '100%',
  },
  searchContainer: {
    height: SEARCH_BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: theme.space16,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchInputWrap: {
    alignItems: 'center',
    backgroundColor: MENU_SURFACE,
    borderColor: 'rgba(255,255,255,0.065)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 40,
    paddingHorizontal: theme.space12,
  },
  searchInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize16,
    fontWeight: '500',
    height: 40,
    minHeight: 40,
    paddingHorizontal: 0,
  },
  searchIcon: {
    color: theme.color.textSecondary.dark,
    opacity: 0.7,
  },
  searchClearButton: {
    alignItems: 'center',
    backgroundColor: MENU_ACTIVE_SURFACE,
    borderRadius: 4,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  searchClearButtonHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  setHeader: {
    alignItems: 'center',
    backgroundColor: '#15161a',
    borderColor: 'rgba(255,255,255,0.045)',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space8,
    marginBottom: theme.space4,
    marginTop: theme.space4,
    minHeight: 40,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space4,
  },
  setHeaderIcon: {
    alignItems: 'center',
    borderRadius: 4,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  setHeaderAvatar: {
    borderRadius: 12,
    height: 24,
    width: 24,
  },
  setHeaderAvatarContainer: {
    borderRadius: 12,
    height: 24,
    overflow: 'hidden',
    width: 24,
  },
  setHeaderTitle: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: theme.fontSize14,
    fontWeight: '600',
    letterSpacing: 0,
  },
  setRailButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#191a1f',
    borderColor: 'rgba(255,255,255,0.045)',
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: 'center',
    marginBottom: theme.space8,
    maxWidth: 44,
    minWidth: 40,
    paddingHorizontal: theme.space4,
  },
  setRailButtonActive: {
    backgroundColor: MENU_ACTIVE_SURFACE,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  setRailEmoji: {
    fontSize: theme.fontSize16,
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
  setRailLabel: {
    color: MENU_MUTED_TEXT,
    fontSize: theme.fontSize10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  setRailLabelActive: {
    color: theme.color.text.dark,
  },
});
