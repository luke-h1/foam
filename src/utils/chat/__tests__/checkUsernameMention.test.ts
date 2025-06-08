import { checkUsernameMention } from '../checkUsernameMention';

describe('checkUsernameMention', () => {
  test('should return true when username is mentioned', () => {
    expect(checkUsernameMention('Hello @user123', 'user123')).toBe(true);
  });

  test('should be case-insensitive', () => {
    expect(checkUsernameMention('Hello @USER123', 'user123')).toBe(true);
    expect(checkUsernameMention('Hello @user123', 'USER123')).toBe(true);
  });

  test('should return false when username is not mentioned', () => {
    expect(checkUsernameMention('Hello world', 'user123')).toBe(false);
  });

  test('should handle special characters in username', () => {
    expect(checkUsernameMention('Hello @user_123', 'user_123')).toBe(true);
    expect(checkUsernameMention('Hello @user-123', 'user-123')).toBe(true);
  });
});
