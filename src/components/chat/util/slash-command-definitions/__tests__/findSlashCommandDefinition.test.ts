import { findSlashCommandDefinition } from '../findSlashCommandDefinition';
import type { SlashCommandDefinition } from '../types';

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
});
