import {
  findSlashCommandDefinition,
  SLASH_COMMAND_DEFINITIONS,
  type SlashCommandDefinition,
} from '../slashCommandDefinitions';

describe('findSlashCommandDefinition', () => {
  test('finds a command by name', () => {
    expect(findSlashCommandDefinition('warn')).toEqual<SlashCommandDefinition>({
      name: 'warn',
      description: 'Warn a user',
      argHint: 'username reason',
    });
  });

  test('finds a command by alias', () => {
    expect(findSlashCommandDefinition('so')).toEqual<SlashCommandDefinition>({
      name: 'shoutout',
      aliases: ['so'],
      description: 'Give a user a shoutout',
      argHint: 'username',
    });
  });

  test('matches case-insensitively', () => {
    expect(findSlashCommandDefinition('WARN')).toEqual<SlashCommandDefinition>({
      name: 'warn',
      description: 'Warn a user',
      argHint: 'username reason',
    });
  });

  test('returns undefined for unknown commands', () => {
    expect(findSlashCommandDefinition('me')).toBeUndefined();
    expect(findSlashCommandDefinition('')).toBeUndefined();
  });

  test('resolves every declared name and alias', () => {
    for (const definition of SLASH_COMMAND_DEFINITIONS) {
      expect(findSlashCommandDefinition(definition.name)).toEqual(definition);
      for (const alias of definition.aliases ?? []) {
        expect(findSlashCommandDefinition(alias)).toEqual(definition);
      }
    }
  });
});
