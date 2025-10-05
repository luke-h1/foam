import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';

export const ffzSanitiisedChannelBadges: SanitisedBadgeSet[] = [
  {
    id: 'vip_badge',
    url: 'https://cdn.frankerfacez.com/room-badge/vip/id/12943173/v/384f5396/4',
    title: 'VIP',
    color: '#ff0000',
    owner_username: '12943173',
    set: 'vip',
    type: 'FFZ channel badge',
  },
  {
    id: 'mod_badge',
    url: 'https://cdn.frankerfacez.com/room-badge/mod/id/12943173/v/56d3bfcd/4',
    title: 'Moderator',
    color: '#00ff00',
    owner_username: '12943173',
    set: 'mod',
    type: 'FFZ channel badge',
  },
];
