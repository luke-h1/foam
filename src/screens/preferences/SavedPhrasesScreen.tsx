import {
  type SavedPhrase,
  updatePreferences,
  usePreference,
} from '@app/store/preference-store';

import { PreferenceListEditor } from './components/PreferenceListEditor';
import { createPreferenceItemId } from './util/preferenceList';
import type { PreferenceListCopy } from './util/preferenceListTypes';

const SAVED_PHRASES_COPY: PreferenceListCopy = {
  placeholder: 'Add a phrase to save…',
  emptyIcon: 'text.bubble',
  emptyTitle: 'No saved phrases',
  emptySubtitle:
    'Save phrases you send often. Tap one to add it to the composer.',
  duplicateMessage: 'That phrase is already saved',
  removeTitle: 'Remove phrase',
  removeMessage: text => `Remove "${text}" from your saved phrases?`,
  itemNoun: { one: 'phrase', other: 'phrases' },
  footerNote: 'Tap a phrase in chat to insert it.',
};

// A saved phrase keeps its case: the composer sends it exactly as typed.
const trimPhrase = (text: string) => text.trim();

export function SavedPhrasesScreen() {
  const savedPhrases = usePreference('savedPhrases');

  return (
    <PreferenceListEditor<SavedPhrase>
      items={savedPhrases}
      getId={phrase => phrase.id}
      getText={phrase => phrase.text}
      normalise={trimPhrase}
      createItem={text => ({ id: createPreferenceItemId(text), text })}
      editItem={(phrase, text) => ({ ...phrase, text })}
      onItemsChange={items => updatePreferences({ savedPhrases: items })}
      inputKind='sentence'
      copy={SAVED_PHRASES_COPY}
    />
  );
}
