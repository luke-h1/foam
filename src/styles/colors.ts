import { pallete } from './pallete';

const commonColors = {
  ...pallete,
  icon: pallete.primaryHighlight,
};
export default commonColors;

export const darkColors = {
  ...commonColors,
  primaryText: pallete.white,
  primaryBackground: pallete.black,
  secondaryText: pallete.gray3,
  secondaryBackground: pallete.almostBlack,
  highlightBackground: pallete.gray5,
  iconDefault: pallete.gray3,
  iconDisabled: pallete.gray4,
  carouselPagination: pallete.gray5,
  languagePickerButton: pallete.gray3,
};

export const lightColors = {
  ...commonColors,
  primaryBackground: pallete.white,
  secondaryText: pallete.gray2,
  secondaryBackground: pallete.almostWhite,
  highlightBackground: pallete.gray1,
  iconDefault: pallete.primaryHighlight,
  iconDisabled: pallete.gray2,
  carouselPagination: pallete.gray2,
  languagePickerButton: pallete.gray3,
};
