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
  /**
   * Turns typed text into the stored text. An empty result means the input
   * held nothing to add.
   */
  normalise: (text: string) => string;
  createItem: (text: string) => Item;
  onItemsChange: (items: Item[]) => void;
  /**
   * `term` turns off autocorrect and capitals for words chat matches on.
   * `sentence` keeps them for text the user sends.
   */
  inputKind: 'term' | 'sentence';
  copy: PreferenceListCopy;
  /**
   * Set to let the user tap an item to change its text.
   */
  editItem?: (item: Item, text: string) => Item;
  /**
   * Set to show a colour dot before each item.
   */
  getColor?: (item: Item) => string;
  colorPicker?: PreferenceListColorPicker;
}
