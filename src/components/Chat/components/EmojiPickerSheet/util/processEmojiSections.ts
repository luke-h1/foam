import { BrandIconName } from '@app/components/BrandIcon';
import { chunkArray } from '@app/utils/array/chunkArray';
import { PickerCell } from '../EmojiPickerSheet';
import { EmojiSection } from '../config';

export interface ProcessedEmojiSection {
  title: string;
  icon: BrandIconName;
  data: PickerCell[][];
  index: number;
  sectionOffset: number;
}

export function processEmojiSections(
  sections: EmojiSection[],
  chunkSize = 6,
): ProcessedEmojiSection[] {
  let globalIndex = 0;

  const nonEmptySections = sections.filter(
    (section): section is EmojiSection & { icon: BrandIconName } =>
      section.data.length > 0 &&
      (section.icon === 'twitch' ||
        section.icon === 'bttv' ||
        section.icon === 'ffz' ||
        section.icon === 'stv'),
  );

  return nonEmptySections.map((section, sectionIndex) => {
    const offset = globalIndex;

    const chunked = chunkArray(section.data as string[], chunkSize).map(row =>
      row.map(item => ({
        item,
        // eslint-disable-next-line no-plusplus
        index: globalIndex++,
      })),
    );

    return {
      ...section,
      data: chunked,
      index: sectionIndex,
      sectionOffset: offset,
    };
  });
}
