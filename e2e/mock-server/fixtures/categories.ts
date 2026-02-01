import { Category, PaginatedList } from '@app/services/twitch-service';

export const mockCategories: Category[] = [
  {
    id: '509658',
    name: 'Just Chatting',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/509658-{width}x{height}.jpg',
    igdb_id: '',
  },
  {
    id: '33214',
    name: 'Fortnite',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/33214-{width}x{height}.jpg',
    igdb_id: '1905',
  },
  {
    id: '32982',
    name: 'Grand Theft Auto V',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/32982_IGDB-{width}x{height}.jpg',
    igdb_id: '1020',
  },
  {
    id: '21779',
    name: 'League of Legends',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/21779-{width}x{height}.jpg',
    igdb_id: '115',
  },
  {
    id: '32399',
    name: 'Counter-Strike',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/32399_IGDB-{width}x{height}.jpg',
    igdb_id: '126459',
  },
  {
    id: '516575',
    name: 'VALORANT',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/516575-{width}x{height}.jpg',
    igdb_id: '126459',
  },
  {
    id: '29595',
    name: 'Dota 2',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/29595-{width}x{height}.jpg',
    igdb_id: '472',
  },
  {
    id: '27471',
    name: 'Minecraft',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/27471_IGDB-{width}x{height}.jpg',
    igdb_id: '121',
  },
  {
    id: '512710',
    name: 'Call of Duty: Warzone',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/512710-{width}x{height}.jpg',
    igdb_id: '131913',
  },
  {
    id: '518203',
    name: 'Sports',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/518203-{width}x{height}.jpg',
    igdb_id: '',
  },
  {
    id: '26936',
    name: 'Music',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/26936-{width}x{height}.jpg',
    igdb_id: '',
  },
  {
    id: '509660',
    name: 'Art',
    box_art_url:
      'https://static-cdn.jtvnw.net/ttv-boxart/509660-{width}x{height}.jpg',
    igdb_id: '',
  },
];

export const getTopCategoriesResponse = (
  cursor?: string,
): PaginatedList<Category> => {
  const pageSize = 20;
  const startIndex = cursor ? parseInt(cursor, 10) : 0;

  const pageCategories = mockCategories.slice(
    startIndex,
    startIndex + pageSize,
  );
  const nextCursor =
    startIndex + pageSize < mockCategories.length
      ? String(startIndex + pageSize)
      : undefined;

  return {
    data: pageCategories,
    pagination: nextCursor ? { cursor: nextCursor } : undefined,
  };
};

export const getCategoryById = (id: string): Category | undefined => {
  return mockCategories.find(c => c.id === id);
};

export const searchCategories = (query: string): PaginatedList<Category> => {
  const filtered = mockCategories.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  return {
    data: filtered,
    pagination: undefined,
  };
};
