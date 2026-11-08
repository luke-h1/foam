import { updatePreferences, usePreference } from '@app/store/preference-store';
import { normaliseChatText } from '@app/utils/chat/normaliseChatText';

import { PreferenceListEditor } from './components/PreferenceListEditor';
import type { PreferenceListCopy } from './util/preferenceListTypes';

const BLOCKED_TERMS_COPY: PreferenceListCopy = {
  placeholder: 'Add a term to block…',
  emptyIcon: 'text.badge.xmark',
  emptyTitle: 'No blocked terms',
  emptySubtitle: 'Chat hides messages that contain a blocked word or phrase.',
  duplicateMessage: 'That term is already blocked',
  removeTitle: 'Remove blocked term',
  removeMessage: term => `Remove "${term}" from your blocked terms?`,
  itemNoun: { one: 'term', other: 'terms' },
  footerNote: 'Chat hides messages that contain these.',
};

const identity = (term: string) => term;

export function BlockedTermsScreen() {
  const blockedTerms = usePreference('blockedTerms');

  return (
    <PreferenceListEditor
      items={blockedTerms}
      getId={identity}
      getText={identity}
      normalise={normaliseChatText}
      createItem={identity}
      onItemsChange={items => updatePreferences({ blockedTerms: items })}
      inputKind='term'
      copy={BLOCKED_TERMS_COPY}
    />
  );
}
