import { useState } from 'react';
import { Alert } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { toast } from 'sonner-native';

import type { PreferenceListCopy } from '@app/screens/preferences/util/preferenceListTypes';
import { normaliseChatText } from '@app/utils/chat/normaliseChatText';

import { PreferenceListEditor as IosPreferenceListEditor } from '../PreferenceListEditor.ios';

const { PreferenceListEditor } = jest.requireActual<
  typeof import('../PreferenceListEditor')
>('../PreferenceListEditor.tsx');

const COPY: PreferenceListCopy = {
  placeholder: 'Add a term…',
  emptyIcon: 'text.badge.xmark',
  emptyTitle: 'No terms',
  emptySubtitle: 'Add one above.',
  duplicateMessage: 'Already added',
  removeTitle: 'Remove term',
  removeMessage: term => `Remove "${term}"?`,
  itemNoun: { one: 'term', other: 'terms' },
  footerNote: 'Kept on this device.',
};

const identity = (term: string) => term;

let latestItems: string[] = [];

function TermsEditor({ initialItems }: { initialItems: string[] }) {
  const [items, setItems] = useState(initialItems);

  return (
    <PreferenceListEditor
      items={items}
      getId={identity}
      getText={identity}
      normalise={normaliseChatText}
      createItem={identity}
      onItemsChange={next => {
        latestItems = next;
        setItems(next);
      }}
      inputKind='term'
      copy={COPY}
    />
  );
}

function submit(text: string) {
  const input = screen.getByPlaceholderText(COPY.placeholder);

  fireEvent.changeText(input, text);
  fireEvent(input, 'submitEditing');
}

describe('PreferenceListEditor', () => {
  beforeEach(() => {
    latestItems = [];
    jest.mocked(toast.error).mockClear();
  });

  test('shows the empty state when there are no items', () => {
    render(<TermsEditor initialItems={[]} />);

    expect(screen.getByText('No terms')).toBeOnTheScreen();
  });

  test('adds a normalised item and clears the input', () => {
    render(<TermsEditor initialItems={[]} />);

    submit('  KappA ');

    expect(latestItems).toEqual(['kappa']);

    expect(screen.getByText('kappa')).toBeOnTheScreen();

    expect(screen.getByPlaceholderText(COPY.placeholder)).toHaveDisplayValue(
      '',
    );
  });

  test('ignores empty input', () => {
    render(<TermsEditor initialItems={[]} />);

    submit('   ');

    expect(latestItems).toEqual([]);

    expect(screen.getByText('No terms')).toBeOnTheScreen();
  });

  test('rejects a duplicate with a toast', () => {
    render(<TermsEditor initialItems={['kappa']} />);

    submit('Kappa');

    expect(latestItems).toEqual([]);

    expect(jest.mocked(toast.error).mock.calls).toEqual([['Already added']]);
  });

  test('removes an item after the user confirms', () => {
    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons) => {
        buttons?.find(button => button.text === 'Remove')?.onPress?.();
      });

    render(<TermsEditor initialItems={['kappa', 'pog']} />);

    fireEvent.press(screen.getAllByLabelText('Remove term')[0]!);

    expect(alertSpy.mock.calls[0]?.slice(0, 2)).toEqual([
      'Remove term',
      'Remove "kappa"?',
    ]);

    expect(latestItems).toEqual(['pog']);

    alertSpy.mockRestore();
  });

  test('the iOS editor mounts with items', () => {
    render(
      <IosPreferenceListEditor
        items={['kappa']}
        getId={identity}
        getText={identity}
        normalise={normaliseChatText}
        createItem={identity}
        onItemsChange={() => {}}
        inputKind='term'
        copy={COPY}
      />,
    );

    expect(screen.toJSON()).not.toBeNull();
  });
});
