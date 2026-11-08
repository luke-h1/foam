import type { SFSymbol } from 'sf-symbols-typescript';

export interface PreferenceListCopy {
  placeholder: string;
  emptyIcon: SFSymbol;
  emptyTitle: string;
  emptySubtitle: string;
  duplicateMessage: string;
  removeTitle: string;
  removeMessage: (text: string) => string;
  itemNoun: { one: string; other: string };
  footerNote: string;
}

export interface PreferenceListColorPicker {
  colors: readonly string[];
  selected: string;
  onSelect: (color: string) => void;
}

export interface PreferenceListEditorProps<Item> {
  items: readonly Item[];
  getId: (item: Item) => string;
  getText: (item: Item) => string;
  normalise: (text: string) => string;
  createItem: (text: string) => Item;
  onItemsChange: (items: Item[]) => void;
  inputKind: 'term' | 'sentence';
  copy: PreferenceListCopy;
  editItem?: (item: Item, text: string) => Item;
  getColor?: (item: Item) => string;
  colorPicker?: PreferenceListColorPicker;
}
