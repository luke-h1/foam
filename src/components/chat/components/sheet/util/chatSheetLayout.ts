import type { SnapPoint } from '@app/components/bottom-sheet/BottomSheet';

/**
 * Every fixed height a chat sheet adds up. Each value is measured from the
 * rendered sheet, so change it when the matching layout changes.
 */
export const SHEET_CHROME = {
  /**
   * A taller sheet hides the chat it opened from and pushes the header under
   * the notch.
   */
  maxScreenFraction: 0.82,
  /**
   * One `SettingsRow` inside a sheet action group.
   */
  rowHeight: 57,
  sectionGap: 24,
  sectionTitleHeight: 26,
  /**
   * Message action sheet: the header, the message preview and the padding.
   */
  messageActions: 196,
  messageActionsMinHeight: 360,
  /**
   * User sheet: the header, the user card and the quick actions.
   */
  userCard: 232,
  /**
   * The "Recent messages" section around its lines, and one line.
   */
  recentMessagesSection: 64,
  recentMessageLine: 30,
  /**
   * Emote and badge preview: the header, the caption and the padding around
   * the image stage.
   */
  assetPreview: 126,
  assetPreviewMinHeight: 420,
  /**
   * Emote action sheet: the 56 pt emote header and the padding.
   */
  emoteActions: 88,
} as const;

/**
 * The detent for the list sheets: settings, chatters and saved phrases.
 */
export const CHAT_SETTINGS_SHEET_DETENT = 0.9;

interface ChatSheetSection {
  rowCount: number;
  titled?: boolean;
}

interface ChatSheetContentLayout {
  /**
   * Everything that is not a row: header, preview, padding.
   */
  chromeHeight: number;
  /**
   * Adds a full-screen detent above the content detent.
   */
  expandable?: boolean;
  kind: 'content';
  minHeight?: number;
  sections: ChatSheetSection[];
}

interface ChatSheetFractionLayout {
  fraction: number;
  kind: 'fraction';
}

export type ChatSheetLayout = ChatSheetContentLayout | ChatSheetFractionLayout;

function getSheetMaxHeight(screenHeight: number): number {
  return Math.round(screenHeight * SHEET_CHROME.maxScreenFraction);
}

/**
 * The fixed detent height for a chat sheet. A content detent does not work:
 * the flexed content has no intrinsic height, so the sheet grows to full
 * height.
 */
export function getChatSheetHeight(
  layout: ChatSheetLayout,
  screenHeight: number,
): number {
  if (layout.kind === 'fraction') {
    return Math.round(screenHeight * layout.fraction);
  }

  const contentHeight = layout.sections.reduce(
    (height, section) =>
      height +
      section.rowCount * SHEET_CHROME.rowHeight +
      SHEET_CHROME.sectionGap +
      (section.titled ? SHEET_CHROME.sectionTitleHeight : 0),
    layout.chromeHeight,
  );

  return Math.min(
    getSheetMaxHeight(screenHeight),
    Math.max(layout.minHeight ?? 0, contentHeight),
  );
}

/**
 * A fraction stays a fraction, so the SwiftUI detent follows rotation.
 */
export function getChatSheetSnapPoints(
  layout: ChatSheetLayout,
  sheetHeight: number,
): SnapPoint[] {
  if (layout.kind === 'fraction') {
    return [{ fraction: layout.fraction }];
  }

  return layout.expandable
    ? [{ height: sheetHeight }, 'full']
    : [{ height: sheetHeight }];
}
