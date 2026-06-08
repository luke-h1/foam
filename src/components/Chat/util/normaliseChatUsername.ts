export function normaliseChatUsername(value?: string | null): string {
  return value?.trim().replace(/^@/, '').toLowerCase() ?? '';
}
