import { useDeferredValue } from 'react';

import type { SlashCommandDefinition } from '@app/components/chat/util/slash-command-definitions/types';

import { CommandSuggestionItem } from './components/CommandSuggestionItem';
import { SuggestionRail } from './components/SuggestionRail';
import { SUGGESTION_ITEM_WIDTH } from './constants';
import { useCommandSuggestions } from './hooks/use-command-suggestions';

interface CommandSuggestionRailProps {
  onSelect: (command: SlashCommandDefinition) => void;
  searchTerm: string;
}

function getCommandKey(command: SlashCommandDefinition): string {
  return command.name;
}

export function CommandSuggestionRail({
  onSelect,
  searchTerm,
}: CommandSuggestionRailProps) {
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const { filteredCommands } = useCommandSuggestions({
    searchTerm: deferredSearchTerm,
  });

  return (
    <SuggestionRail
      estimatedItemSize={SUGGESTION_ITEM_WIDTH.command}
      Item={CommandSuggestionItem}
      items={filteredCommands}
      keyExtractor={getCommandKey}
      onSelect={onSelect}
      title='Commands'
    />
  );
}
