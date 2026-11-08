import { Alert } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { toast } from 'sonner-native';

import {
  getPreferences,
  replacePreferences,
  type SavedPhrase,
} from '@app/store/preference-store';

import { SavedPhrasesScreen } from '../SavedPhrasesScreen';

// Jest resolves the editor to its iOS variant. These tests cover the Android
// and web editor, so the mock loads that file by its full name.
jest.mock('../components/PreferenceListEditor', () =>
  jest.requireActual('../components/PreferenceListEditor.tsx'),
);

function seedSavedPhrases(savedPhrases: SavedPhrase[]) {
  replacePreferences({ ...getPreferences(), savedPhrases });
}

describe('SavedPhrasesScreen', () => {
  beforeEach(() => {
    seedSavedPhrases([]);
    jest.mocked(toast.error).mockClear();
  });

  test('shows the empty state when there are no saved phrases', () => {
    render(<SavedPhrasesScreen />);

    expect(screen.getByText('No saved phrases')).toBeOnTheScreen();
  });

  test('adds a trimmed phrase', () => {
    render(<SavedPhrasesScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Add a phrase to save…'),
      '  gg wp  ',
    );

    fireEvent(
      screen.getByPlaceholderText('Add a phrase to save…'),
      'submitEditing',
    );

    const added = getPreferences().savedPhrases;
    expect(added.map(phrase => phrase.text)).toEqual(['gg wp']);
  });

  test('renders existing phrases and removes one after confirming', () => {
    seedSavedPhrases([{ id: 'a', text: 'be right back' }]);

    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        const remove = buttons?.find(button => button.text === 'Remove');
        remove?.onPress?.();
      });

    render(<SavedPhrasesScreen />);

    expect(screen.getByText('be right back')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('Remove phrase'));

    expect(alertSpy.mock.calls[0]?.slice(0, 2)).toEqual([
      'Remove phrase',
      'Remove "be right back" from your saved phrases?',
    ]);

    expect(getPreferences().savedPhrases).toEqual([]);

    alertSpy.mockRestore();
  });

  test('edits an existing phrase in place', () => {
    seedSavedPhrases([{ id: 'a', text: 'old phrase' }]);

    render(<SavedPhrasesScreen />);

    fireEvent.press(screen.getByText('old phrase'));

    fireEvent.changeText(
      screen.getByDisplayValue('old phrase'),
      'updated phrase',
    );

    fireEvent(screen.getByDisplayValue('updated phrase'), 'submitEditing');

    expect(getPreferences().savedPhrases).toEqual<SavedPhrase[]>([
      { id: 'a', text: 'updated phrase' },
    ]);
  });

  test('rejects an edit that duplicates another phrase', () => {
    seedSavedPhrases([
      { id: 'a', text: 'first phrase' },
      { id: 'b', text: 'second phrase' },
    ]);

    render(<SavedPhrasesScreen />);

    fireEvent.press(screen.getByText('first phrase'));

    fireEvent.changeText(
      screen.getByDisplayValue('first phrase'),
      'second phrase',
    );

    fireEvent(screen.getByDisplayValue('second phrase'), 'submitEditing');

    expect(getPreferences().savedPhrases).toEqual<SavedPhrase[]>([
      { id: 'a', text: 'first phrase' },
      { id: 'b', text: 'second phrase' },
    ]);
  });

  test('saves an edit that keeps the phrase text unchanged', () => {
    seedSavedPhrases([{ id: 'a', text: 'same phrase' }]);

    render(<SavedPhrasesScreen />);

    fireEvent.press(screen.getByText('same phrase'));
    fireEvent(screen.getByDisplayValue('same phrase'), 'submitEditing');

    expect(toast.error).not.toHaveBeenCalled();

    expect(screen.queryByDisplayValue('same phrase')).not.toBeOnTheScreen();

    expect(getPreferences().savedPhrases).toEqual<SavedPhrase[]>([
      { id: 'a', text: 'same phrase' },
    ]);
  });
});
