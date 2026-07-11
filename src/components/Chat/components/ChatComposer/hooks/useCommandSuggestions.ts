import { SLASH_COMMAND_DEFINITIONS } from '@app/components/Chat/util/slashCommandDefinitions/SLASH_COMMAND_DEFINITIONS';

interface UseCommandSuggestionsProps {
  searchTerm: string;
  maxSuggestions?: number;
}

export function useCommandSuggestions({
  searchTerm,
  maxSuggestions = 20,
}: UseCommandSuggestionsProps) {
  const lowerSearch = searchTerm.trim().toLowerCase();

  const filteredCommands = SLASH_COMMAND_DEFINITIONS.filter(command => {
    if (lowerSearch.length < 1) {
      return true;
    }
    return (
      command.name.toLowerCase().startsWith(lowerSearch) ||
      command.aliases?.some(alias =>
        alias.toLowerCase().startsWith(lowerSearch),
      )
    );
  }).slice(0, maxSuggestions);

  return { filteredCommands };
}
