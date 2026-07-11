import { isRefreshCommand } from '../isRefreshCommand';

describe('isRefreshCommand', () => {
  test('matches the bare command with surrounding whitespace and any case', () => {
    expect(isRefreshCommand('/refresh')).toBe(true);
    expect(isRefreshCommand('  /Refresh  ')).toBe(true);
  });

  test('tolerates trailing text like other argument-less commands', () => {
    expect(isRefreshCommand('/refresh extra words')).toBe(true);
  });

  test('rejects other input', () => {
    expect(isRefreshCommand('refresh')).toBe(false);
    expect(isRefreshCommand('/refreshx')).toBe(false);
    expect(isRefreshCommand('hello /refresh')).toBe(false);
    expect(isRefreshCommand('')).toBe(false);
  });
});
