import { useState } from 'react';
import { Alert } from 'react-native';

import { toast } from 'sonner-native';

import { impact } from '@app/lib/haptics';

import {
  type PreferenceListSaveResult,
  savePreferenceListItem,
} from '../util/preferenceList';
import type { PreferenceListEditorProps } from '../util/preferenceListTypes';

export function usePreferenceListEditor<Item>({
  items,
  getId,
  getText,
  normalise,
  createItem,
  onItemsChange,
  copy,
  editItem,
}: PreferenceListEditorProps<Item>) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = (rawText: string): PreferenceListSaveResult => {
    const saved = savePreferenceListItem({
      items,
      rawText,
      editingId,
      normalise,
      getId,
      getText,
      createItem,
      editItem,
    });

    if (saved.result === 'duplicate') {
      toast.error(copy.duplicateMessage);
    }

    if (saved.result === 'added' || saved.result === 'edited') {
      onItemsChange([...saved.items]);
      impact('light');
    }

    if (saved.result === 'edited') {
      setEditingId(null);
    }

    return saved.result;
  };

  const startEditing = editItem
    ? (item: Item) => setEditingId(getId(item))
    : undefined;

  const confirmRemove = (
    targets: readonly Item[],
    onEditingRemoved: () => void,
  ) => {
    const first = targets[0];

    if (first === undefined) {
      return;
    }

    const removedIds = new Set(targets.map(getId));

    Alert.alert(copy.removeTitle, copy.removeMessage(getText(first)), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          impact('medium');

          if (editingId !== null && removedIds.has(editingId)) {
            setEditingId(null);
            onEditingRemoved();
          }

          onItemsChange(items.filter(item => !removedIds.has(getId(item))));
        },
      },
    ]);
  };

  return { editingId, save, startEditing, confirmRemove };
}
