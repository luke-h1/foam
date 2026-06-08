import { theme } from '@app/styles/themes';

const DEFAULT_STAGE_SIZE = 112;
const PREVIEW_PADDING = 12;
const LABEL_GAP = theme.space8;
const LABEL_LINE_HEIGHT = 16;

export function getChatAssetContextPreviewSize({
  showLabel,
  stageSize = DEFAULT_STAGE_SIZE,
}: {
  showLabel: boolean;
  stageSize?: number;
}) {
  return {
    height:
      stageSize +
      PREVIEW_PADDING * 2 +
      (showLabel ? LABEL_GAP + LABEL_LINE_HEIGHT : 0),
    width: stageSize + PREVIEW_PADDING * 2,
  };
}

export { DEFAULT_STAGE_SIZE, LABEL_GAP, LABEL_LINE_HEIGHT, PREVIEW_PADDING };
