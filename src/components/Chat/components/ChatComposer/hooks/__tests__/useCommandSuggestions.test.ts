import { renderHook } from '@testing-library/react-native';

import { useCommandSuggestions } from '../useCommandSuggestions';

test('returns all commands when the search term is empty', () => {
  const { result } = renderHook(() =>
    useCommandSuggestions({ searchTerm: '' }),
  );

  expect(result.current.filteredCommands.length).toBeGreaterThan(0);
});

test('filters commands by name prefix', () => {
  const { result } = renderHook(() =>
    useCommandSuggestions({ searchTerm: 'time' }),
  );

  expect(result.current.filteredCommands.map(command => command.name)).toEqual([
    'timeout',
  ]);
});

test('filters commands by alias prefix', () => {
  const { result } = renderHook(() =>
    useCommandSuggestions({ searchTerm: 'so' }),
  );

  expect(result.current.filteredCommands.map(command => command.name)).toEqual([
    'shoutout',
  ]);
});

test('respects the maxSuggestions cap', () => {
  const { result } = renderHook(() =>
    useCommandSuggestions({ searchTerm: '', maxSuggestions: 2 }),
  );

  expect(result.current.filteredCommands.length).toBe(2);
});
