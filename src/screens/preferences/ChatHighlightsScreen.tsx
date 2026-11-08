import { useState } from 'react';

import { updatePreferences, usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { CustomHighlight } from '@app/types/chat/customHighlight';
import { normaliseChatText } from '@app/utils/chat/normaliseChatText';

import { PreferenceListEditor } from './components/PreferenceListEditor';
import { createPreferenceItemId } from './util/preferenceList';
import type { PreferenceListCopy } from './util/preferenceListTypes';

const HIGHLIGHT_COLORS = [
  theme.colorPrimary,
  theme.colorBlue,
  theme.colorViolet,
  theme.colorAmber,
  theme.colorOrange,
  theme.colorRed,
] as const;

const HIGHLIGHTS_COPY: PreferenceListCopy = {
  placeholder: 'Add a phrase to highlight…',
  emptyIcon: 'highlighter',
  emptyTitle: 'No highlights',
  emptySubtitle:
    'Messages with a highlighted phrase get a color tint. They also buzz when mention feedback is on.',
  duplicateMessage: 'That phrase is already highlighted',
  removeTitle: 'Remove highlight',
  removeMessage: phrase => `Stop highlighting messages containing "${phrase}"?`,
  itemNoun: { one: 'phrase', other: 'phrases' },
  footerNote: 'Matching messages are tinted in chat.',
};

export function ChatHighlightsScreen() {
  const customHighlights = usePreference('customHighlights');

  const [selectedColor, setSelectedColor] = useState<string>(
    HIGHLIGHT_COLORS[0],
  );

  return (
    <PreferenceListEditor<CustomHighlight>
      items={customHighlights}
      getId={highlight => highlight.id}
      getText={highlight => highlight.phrase}
      getColor={highlight => highlight.color}
      normalise={normaliseChatText}
      createItem={phrase => ({
        id: createPreferenceItemId(phrase),
        phrase,
        color: selectedColor,
      })}
      onItemsChange={items => updatePreferences({ customHighlights: items })}
      inputKind='term'
      copy={HIGHLIGHTS_COPY}
      colorPicker={{
        colors: HIGHLIGHT_COLORS,
        selected: selectedColor,
        onSelect: setSelectedColor,
      }}
    />
  );
}
