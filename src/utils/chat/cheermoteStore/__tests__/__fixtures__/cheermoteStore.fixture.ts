import type { TwitchCheermote } from '@app/types/twitch/bits';

export function makeCheermote(prefix: string): TwitchCheermote {
  return {
    prefix,
    tiers: [
      {
        min_bits: 1,
        id: '1',
        color: '#979797',
        images: {
          dark: {
            animated: { '1': `https://cdn.example.com/${prefix}/1/1.gif` },
            static: { '1': `https://cdn.example.com/${prefix}/1/1.png` },
          },
          light: { animated: {}, static: {} },
        },
        can_cheer: true,
        show_in_bits_card: true,
      },
      {
        min_bits: 100,
        id: '100',
        color: '#9c3ee8',
        images: {
          dark: {
            animated: {
              '1': `https://cdn.example.com/${prefix}/100/1.gif`,
              '2': `https://cdn.example.com/${prefix}/100/2.gif`,
            },
            static: { '2': `https://cdn.example.com/${prefix}/100/2.png` },
          },
          light: { animated: {}, static: {} },
        },
        can_cheer: true,
        show_in_bits_card: true,
      },
    ],
    type: 'global_first_party',
    order: 1,
    last_updated: '2024-01-01T00:00:00Z',
    is_charitable: false,
  };
}
