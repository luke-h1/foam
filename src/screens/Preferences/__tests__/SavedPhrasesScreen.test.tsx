import { Alert } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import type { SavedPhrase } from '@app/store/preferenceStore';

import { SavedPhrasesScreen } from '../SavedPhrasesScreen';

let mockSavedPhrases: SavedPhrase[] = [];
const mockUpdate = jest.fn((payload: { savedPhrases?: SavedPhrase[] }) => {
  if (payload.savedPhrases) {
    mockSavedPhrases = payload.savedPhrases;
  }
});

jest.mock('@app/store/preferenceStore', () => ({
  usePreference: () => mockSavedPhrases,
  useUpdatePreferences: () => mockUpdate,
}));

jest.mock('@app/lib/haptics', () => ({
  impact: jest.fn(() => Promise.resolve()),
}));

describe('SavedPhrasesScreen', () => {
  beforeEach(() => {
    mockSavedPhrases = [];
    mockUpdate.mockClear();
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

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const added = mockUpdate.mock.calls[0]![0].savedPhrases!;
    expect(added.map(phrase => phrase.text)).toEqual(['gg wp']);
  });

  test('renders existing phrases and removes one after confirming', () => {
    mockSavedPhrases = [{ id: 'a', text: 'be right back' }];
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
    expect(mockUpdate).toHaveBeenCalledWith({ savedPhrases: [] });

    alertSpy.mockRestore();
  });

  test('edits an existing phrase in place', () => {
    mockSavedPhrases = [{ id: 'a', text: 'old phrase' }];

    render(<SavedPhrasesScreen />);

    fireEvent.press(screen.getByText('old phrase'));
    fireEvent.changeText(
      screen.getByDisplayValue('old phrase'),
      'updated phrase',
    );
    fireEvent(screen.getByDisplayValue('updated phrase'), 'submitEditing');

    expect(mockUpdate).toHaveBeenCalledWith({
      savedPhrases: [{ id: 'a', text: 'updated phrase' }],
    });
  });
});
