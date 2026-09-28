import { SLASH_COMMAND_DEFINITIONS } from '@app/components/chat/util/slash-command-definitions/slash-command-definitions';
import { normaliseChatText } from '@app/utils/chat/normalise-chat-text';

interface UseCommandSuggestionsProps {
  searchTerm: string;
  maxSuggestions?: number;
}

export function useCommandSuggestions({
  searchTerm,
  maxSuggestions = 20,
}: UseCommandSuggestionsProps) {
  const lowerSearch = normaliseChatText(searchTerm);

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
