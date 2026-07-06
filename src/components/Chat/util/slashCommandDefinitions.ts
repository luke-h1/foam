export const REFRESH_COMMAND = '/refresh';

/**
 * True when the input invokes `/refresh`. Matches on the first token so
 * trailing text is tolerated, mirroring how `parseModCommand` treats other
 * argument-less commands like `/slowoff`.
 */
export function isRefreshCommand(input: string): boolean {
  const [firstToken = ''] = input.trim().toLowerCase().split(/\s+/);
  return firstToken === REFRESH_COMMAND;
}

export interface SlashCommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  argHint?: string;
}

/**
 * Declarative list mirroring the commands `parseModCommand` recognises.
 * Kept in sync by hand since the parser is a switch, not a table.
 *
 * `refresh` is the one exception: it's handled by an exact-match check in
 * `ChatInputShell` before `parseModCommand` runs, so it has no case there.
 */
export const SLASH_COMMAND_DEFINITIONS: SlashCommandDefinition[] = [
  {
    name: 'timeout',
    description: 'Time out a user',
    argHint: 'username [seconds] [reason]',
  },
  { name: 'ban', description: 'Ban a user', argHint: 'username [reason]' },
  {
    name: 'unban',
    aliases: ['untimeout'],
    description: 'Remove a ban or timeout',
    argHint: 'username',
  },
  {
    name: 'warn',
    description: 'Warn a user',
    argHint: 'username reason',
  },
  {
    name: 'announce',
    description: 'Send an announcement',
    argHint: 'message',
  },
  {
    name: 'shoutout',
    aliases: ['so'],
    description: 'Give a user a shoutout',
    argHint: 'username',
  },
  {
    name: 'slow',
    description: 'Enable slow mode',
    argHint: '[seconds]',
  },
  { name: 'slowoff', description: 'Disable slow mode' },
  {
    name: 'followers',
    description: 'Enable followers-only mode',
    argHint: '[minutes]',
  },
  { name: 'followersoff', description: 'Disable followers-only mode' },
  { name: 'subscribers', description: 'Enable subscribers-only mode' },
  { name: 'subscribersoff', description: 'Disable subscribers-only mode' },
  { name: 'emoteonly', description: 'Enable emote-only mode' },
  { name: 'emoteonlyoff', description: 'Disable emote-only mode' },
  { name: 'uniquechat', description: 'Enable unique-chat mode' },
  { name: 'uniquechatoff', description: 'Disable unique-chat mode' },
  { name: 'shield', description: 'Enable Shield Mode' },
  { name: 'shieldoff', description: 'Disable Shield Mode' },
  { name: 'refresh', description: 'Refresh emotes and badges' },
];

/**
 * Looks up a definition by command name or alias (without the leading slash),
 * case-insensitively. Returns undefined for unknown commands.
 */
export function findSlashCommandDefinition(
  command: string,
): SlashCommandDefinition | undefined {
  const lower = command.toLowerCase();
  return SLASH_COMMAND_DEFINITIONS.find(
    definition =>
      definition.name === lower || definition.aliases?.includes(lower),
  );
}
