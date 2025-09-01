import { SanitisiedEmoteSet } from '@app/services';
import { ViewStyle } from 'react-native';

export const TOP_CORNER_STYLE: ViewStyle = {
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
};

export type PickerItem = string | SanitisiedEmoteSet;

export interface HeaderItem {
  type: 'header';
  title: string;
}

export interface RowItem {
  type: 'row';
  data: PickerItem[];
}

export type FlatListItem = HeaderItem | RowItem;
