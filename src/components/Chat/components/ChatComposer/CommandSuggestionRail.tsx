import { useDeferredValue } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import type { SlashCommandDefinition } from '@app/components/Chat/util/slashCommandDefinitions';

import { CommandSuggestions } from './components/CommandSuggestions';
import { useCommandSuggestions } from './hooks/useCommandSuggestions';
import {
  suggestionRailEntering,
  suggestionRailExiting,
} from './suggestionRailAnimations';

interface CommandSuggestionRailProps {
  handleCommandSelect: (command: SlashCommandDefinition) => void;
  maxSuggestions: number;
  searchTerm: string;
}

export function CommandSuggestionRail({
  handleCommandSelect,
  maxSuggestions,
  searchTerm,
}: CommandSuggestionRailProps) {
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const { filteredCommands } = useCommandSuggestions({
    searchTerm: deferredSearchTerm,
    maxSuggestions,
  });

  if (filteredCommands.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={styles.suggestionRail}
      entering={suggestionRailEntering}
      exiting={suggestionRailExiting}
    >
      <CommandSuggestions
        commands={filteredCommands}
        handleCommandSelect={handleCommandSelect}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  suggestionRail: {
    bottom: '100%',
    left: 0,
    paddingBottom: 6,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
});
