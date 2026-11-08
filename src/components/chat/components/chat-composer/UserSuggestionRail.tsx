import type { ChatUser } from '@app/types/chat/chatMessage';

import { SuggestionRail } from './components/SuggestionRail';
import { UserSuggestionItem } from './components/UserSuggestionItem';
import { SUGGESTION_ITEM_WIDTH } from './constants';
import { useUserSuggestions } from './hooks/use-user-suggestions';

interface UserSuggestionRailProps {
  onSelect: (user: ChatUser) => void;
  searchTerm: string;
}

function getUserKey(user: ChatUser): string {
  return user.name;
}

export function UserSuggestionRail({
  onSelect,
  searchTerm,
}: UserSuggestionRailProps) {
  const { filteredUsers } = useUserSuggestions({ searchTerm });

  return (
    <SuggestionRail
      estimatedItemSize={SUGGESTION_ITEM_WIDTH.user}
      Item={UserSuggestionItem}
      items={filteredUsers}
      keyExtractor={getUserKey}
      onSelect={onSelect}
      title='Mention'
    />
  );
}
