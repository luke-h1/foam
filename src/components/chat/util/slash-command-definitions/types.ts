export interface SlashCommandDefinition {
  name: string;
  aliases?: string[];
  description: string;
  argHint?: string;
}
