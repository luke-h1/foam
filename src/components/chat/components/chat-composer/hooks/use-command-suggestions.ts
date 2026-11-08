import { SLASH_COMMAND_DEFINITIONS } from '@app/components/chat/util/slash-command-definitions/slashCommandDefinitions';
import { normaliseChatText } from '@app/utils/chat/normaliseChatText';

interface UseCommandSuggestionsOptions {
  searchTerm: string;
  maxSuggestions?: number;
}

export function useCommandSuggestions({
  searchTerm,
  maxSuggestions = 50,
}: UseCommandSuggestionsOptions) {
  const lowerSearch = normaliseChatText(searchTerm);

  const filteredCommands = SLASH_COMMAND_DEFINITIONS.filter(command => {
    if (lowerSearch.length < 1) {
      return true;
    }

    return (
      normaliseChatText(command.name).startsWith(lowerSearch) ||
      command.aliases?.some(alias =>
        normaliseChatText(alias).startsWith(lowerSearch),
      )
    );
  }).slice(0, maxSuggestions);

  return { filteredCommands };
}
