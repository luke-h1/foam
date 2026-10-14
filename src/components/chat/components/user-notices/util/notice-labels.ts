export function getMilestoneMetaLabel(category: string): string {
  switch (category) {
    case 'watch-streak':
      return 'Watch streak';
    case 'follow':
      return 'Follow milestone';
    default:
      return 'Milestone';
  }
}

export function getRitualMetaLabel(ritualName: string): string {
  switch (ritualName) {
    case 'new_chatter':
      return 'New chatter';
    default:
      return ritualName ? ritualName.replace(/_/g, ' ') : 'Chat ritual';
  }
}

export function getRitualIcon(
  ritualName: string,
): 'hand.wave.fill' | 'sparkles' {
  return ritualName === 'new_chatter' ? 'hand.wave.fill' : 'sparkles';
}

export function getRitualDescription(
  ritualName: string,
  displayName: string,
): string {
  switch (ritualName) {
    case 'new_chatter':
      return `${displayName} is new to the chat.`;
    default:
      return ritualName
        ? `${displayName} performed the ${ritualName.replace(/_/g, ' ')} ritual.`
        : `${displayName} performed a chat ritual.`;
  }
}
