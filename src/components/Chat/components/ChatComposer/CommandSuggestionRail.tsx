import { useDeferredValue } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SlashCommandDefinition } from '@app/components/Chat/util/slashCommandDefinitions';

import { CommandSuggestions } from './components/CommandSuggestions';
import { useCommandSuggestions } from './hooks/useCommandSuggestions';
import { useSuggestionAnimations } from './hooks/useSuggestionAnimations';

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

  const { opacity, scale, translateY } = useSuggestionAnimations({
    shouldShow: filteredCommands.length > 0,
  });

  if (filteredCommands.length === 0) {
    return null;
  }

  return (
    <View style={styles.suggestionRail}>
      <CommandSuggestions
        commands={filteredCommands}
        handleCommandSelect={handleCommandSelect}
        suggestionOpacity={opacity}
        suggestionScale={scale}
        suggestionTranslateY={translateY}
      />
    </View>
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
