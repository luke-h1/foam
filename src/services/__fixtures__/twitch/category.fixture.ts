import type { Category } from '@app/types/twitch/category';

export function createCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat1',
    name: 'Just Chatting',
    box_art_url: 'https://example.com/art-{width}x{height}.jpg',
    ...overrides,
  };
}
