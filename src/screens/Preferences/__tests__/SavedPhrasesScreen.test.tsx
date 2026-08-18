import { Alert, Platform } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  getPreferences,
  replacePreferences,
  type SavedPhrase,
} from '@app/store/preferenceStore';

import { SavedPhrasesScreen } from '../SavedPhrasesScreen';

const originalOS = Platform.OS;
beforeAll(() => {
  Platform.OS = 'android';
});
afterAll(() => {
  Platform.OS = originalOS;
});

function seedSavedPhrases(savedPhrases: SavedPhrase[]) {
  replacePreferences({ ...getPreferences(), savedPhrases });
}

describe('SavedPhrasesScreen', () => {
  beforeEach(() => {
    seedSavedPhrases([]);
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

    expect(alertSpy).toHaveBeenCalled();
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

    expect(getPreferences().savedPhrases).toEqual<SavedPhrase[]>([
      { id: 'a', text: 'same phrase' },
    ]);
  });

  describe('iOS native branch', () => {
    beforeAll(() => {
      Platform.OS = 'ios';
    });
    afterAll(() => {
      Platform.OS = 'android';
    });

    // The @expo/ui/swift-ui primitives render as opaque native host views, so
    // their text is not queryable in tests.
    test('mounts the native list branch without crashing', () => {
      seedSavedPhrases([{ id: 'a', text: 'be right back' }]);

      render(<SavedPhrasesScreen />);

      expect(screen.toJSON()).not.toBeNull();
    });
  });
});
