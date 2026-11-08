import type { PreferenceListCopy } from './preferenceListTypes';

export type PreferenceListSaveResult =
  | 'added'
  | 'duplicate'
  | 'edited'
  | 'empty';

export function createPreferenceItemId(text: string): string {
  return `${Date.now()}_${text}`;
}

interface SavePreferenceListItemOptions<Item> {
  items: readonly Item[];
  rawText: string;
  editingId: string | null;
  normalise: (text: string) => string;
  getId: (item: Item) => string;
  getText: (item: Item) => string;
  createItem: (text: string) => Item;
  editItem: ((item: Item, text: string) => Item) | undefined;
}

export interface SavedPreferenceList<Item> {
  result: PreferenceListSaveResult;
  items: readonly Item[];
}

export function savePreferenceListItem<Item>({
  items,
  rawText,
  editingId,
  normalise,
  getId,
  getText,
  createItem,
  editItem,
}: SavePreferenceListItemOptions<Item>): SavedPreferenceList<Item> {
  const text = normalise(rawText);

  if (!text) {
    return { result: 'empty', items };
  }

  const isDuplicate = items.some(
    item => getId(item) !== editingId && getText(item) === text,
  );

  if (isDuplicate) {
    return { result: 'duplicate', items };
  }

  if (editingId !== null && editItem) {
    return {
      result: 'edited',
      items: items.map(item =>
        getId(item) === editingId ? editItem(item, text) : item,
      ),
    };
  }

  return { result: 'added', items: [...items, createItem(text)] };
}

export function formatPreferenceListFooter(
  count: number,
  { itemNoun, footerNote }: PreferenceListCopy,
): string {
  return `${count} ${count === 1 ? itemNoun.one : itemNoun.other} · ${footerNote}`;
}
