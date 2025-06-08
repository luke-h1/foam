import { checkUsernameVariations } from '../checkUsernameVariations';

describe('checkUsernameVariations', () => {
  test('should return true when username is mentioned with @', async () => {
    const result = await checkUsernameVariations('Hello @user123', 'user123');
    expect(result).toBe(true);
  });

  test('should return true when username is mentioned without @', async () => {
    const result = await checkUsernameVariations('Hello user123', 'user123');
    expect(result).toBe(true);
  });

  test('should return true when username is mentioned with @ and comma', async () => {
    const result = await checkUsernameVariations('Hello @user123,', 'user123');
    expect(result).toBe(true);
  });

  test('should return true when username is mentioned with comma', async () => {
    const result = await checkUsernameVariations('Hello user123,', 'user123');
    expect(result).toBe(true);
  });

  test('should be case-insensitive', async () => {
    const result = await checkUsernameVariations('Hello @USER123', 'user123');
    expect(result).toBe(true);
  });

  test('should return false when username is not mentioned', async () => {
    const result = await checkUsernameVariations('Hello world', 'user123');
    expect(result).toBe(false);
  });

  test('should return false when username is part of another word', async () => {
    const result = await checkUsernameVariations('Hello user1234', 'user123');
    expect(result).toBe(false);
  });

  test('should handle special characters in username', async () => {
    const result = await checkUsernameVariations('Hello @user_123', 'user_123');
    expect(result).toBe(true);
  });
});
