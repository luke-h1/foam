import { isSharedChatDuplicatedNotice } from '../isSharedChatDuplicatedNotice';

describe('isSharedChatDuplicatedNotice', () => {
  test('is a duplicate when the source room differs from the room', () => {
    expect(
      isSharedChatDuplicatedNotice({
        'source-room-id': '111',
        'room-id': '222',
      }),
    ).toBe(true);
  });

  test('is not a duplicate when the source room matches the room', () => {
    expect(
      isSharedChatDuplicatedNotice({
        'source-room-id': '111',
        'room-id': '111',
      }),
    ).toBe(false);
  });

  test('is not a duplicate when the source room id is missing', () => {
    expect(isSharedChatDuplicatedNotice({ 'room-id': '222' })).toBe(false);
  });

  test('is not a duplicate when the room id is missing', () => {
    expect(isSharedChatDuplicatedNotice({ 'source-room-id': '111' })).toBe(
      false,
    );
  });

  test('is not a duplicate when both ids are missing', () => {
    expect(isSharedChatDuplicatedNotice({})).toBe(false);
  });

  test('is not a duplicate when the source room id is an empty string', () => {
    expect(
      isSharedChatDuplicatedNotice({ 'source-room-id': '', 'room-id': '222' }),
    ).toBe(false);
  });
});
