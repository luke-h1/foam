import type { SnapPoint } from '@app/components/bottom-sheet/BottomSheet';

export const SHEET_CHROME = {
  maxScreenFraction: 0.82,
  rowHeight: 57,
  sectionGap: 24,
  sectionTitleHeight: 26,
  messageActions: 196,
  messageActionsMinHeight: 360,
  userCard: 232,
  recentMessagesSection: 64,
  recentMessageLine: 30,
  assetPreview: 126,
  assetPreviewMinHeight: 420,
  emoteActions: 88,
} as const;

export const CHAT_SETTINGS_SHEET_DETENT = 0.9;

interface ChatSheetSection {
  rowCount: number;
  titled?: boolean;
}

interface ChatSheetContentLayout {
  chromeHeight: number;
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
