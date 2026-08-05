import { twitchService } from '@app/services/twitch-service';
import type { UserInfoResponse } from '@app/types/twitch/user';

import {
  executeModCommand,
  type ModCommandContext,
} from '../executeModCommand';

jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    banChatUser: jest.fn(),
    getUser: jest.fn(),
    sendChatAnnouncement: jest.fn(),
    sendShoutout: jest.fn(),
    unbanChatUser: jest.fn(),
    updateChatSettings: jest.fn(),
    updateShieldMode: jest.fn(),
    warnChatUser: jest.fn(),
  },
}));

const service = jest.mocked(twitchService);

const context = {
  broadcasterId: 'channel-1',
  moderatorId: 'mod-1',
} satisfies ModCommandContext;

function makeUser(id: string): UserInfoResponse {
  return {
    broadcaster_type: '',
    created_at: '2013-06-03T19:12:02Z',
    description: '',
    display_name: 'Zoil',
    id,
    login: 'zoil',
    offline_image_url: '',
    profile_image_url: 'https://cdn.example.com/zoil.png',
    type: '',
    view_count: 0,
  };
}

describe('executeModCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getUser.mockResolvedValue(makeUser('user-9'));
  });

  test('timeout resolves the login and bans with a duration', async () => {
    const message = await executeModCommand(
      { type: 'timeout', login: 'zoil', durationSeconds: 600, reason: 'spam' },
      context,
    );

    expect(service.getUser).toHaveBeenCalledWith('zoil');
    expect(service.banChatUser).toHaveBeenCalledWith(
      'channel-1',
      'mod-1',
      'user-9',
      { durationSeconds: 600, reason: 'spam' },
    );
    expect(message).toEqual('Timed out zoil for 600s');
  });

  test('ban resolves the login and bans permanently', async () => {
    const message = await executeModCommand(
      { type: 'ban', login: 'zoil', reason: 'rules' },
      context,
    );

    expect(service.banChatUser).toHaveBeenCalledWith(
      'channel-1',
      'mod-1',
      'user-9',
      { reason: 'rules' },
    );
    expect(message).toEqual('Banned zoil');
  });

  test('unban lifts the ban for the resolved user', async () => {
    const message = await executeModCommand(
      { type: 'unban', login: 'zoil' },
      context,
    );

    expect(service.unbanChatUser).toHaveBeenCalledWith(
      'channel-1',
      'mod-1',
      'user-9',
    );
    expect(message).toEqual('Unbanned zoil');
  });

  test('warn sends the warning reason', async () => {
    const message = await executeModCommand(
      { type: 'warn', login: 'zoil', reason: 'be nice' },
      context,
    );

    expect(service.warnChatUser).toHaveBeenCalledWith(
      'channel-1',
      'mod-1',
      'user-9',
      'be nice',
    );
    expect(message).toEqual('Warned zoil');
  });

  test('announce posts the announcement without resolving a user', async () => {
    const message = await executeModCommand(
      { type: 'announce', message: 'drops enabled' },
      context,
    );

    expect(service.getUser).not.toHaveBeenCalled();
    expect(service.sendChatAnnouncement).toHaveBeenCalledWith(
      'channel-1',
      'mod-1',
      'drops enabled',
    );
    expect(message).toEqual('Announcement sent');
  });

  test('shoutout targets the resolved user', async () => {
    const message = await executeModCommand(
      { type: 'shoutout', login: 'zoil' },
      context,
    );

    expect(service.sendShoutout).toHaveBeenCalledWith(
      'channel-1',
      'user-9',
      'mod-1',
    );
    expect(message).toEqual('Shoutout sent for zoil');
  });

  test('chatMode patches chat settings and labels the toast', async () => {
    const message = await executeModCommand(
      {
        type: 'chatMode',
        label: 'Slow mode',
        patch: { slow_mode: true, slow_mode_wait_time: 30 },
      },
      context,
    );

    expect(service.updateChatSettings).toHaveBeenCalledWith(
      'channel-1',
      'mod-1',
      { slow_mode: true, slow_mode_wait_time: 30 },
    );
    expect(message).toEqual('Slow mode applied');
  });

  test('shield toggles shield mode on', async () => {
    const message = await executeModCommand(
      { type: 'shield', active: true },
      context,
    );

    expect(service.updateShieldMode).toHaveBeenCalledWith(
      'channel-1',
      'mod-1',
      true,
    );
    expect(message).toEqual('Shield mode enabled');
  });

  test('shield toggles shield mode off', async () => {
    const message = await executeModCommand(
      { type: 'shield', active: false },
      context,
    );

    expect(service.updateShieldMode).toHaveBeenCalledWith(
      'channel-1',
      'mod-1',
      false,
    );
    expect(message).toEqual('Shield mode disabled');
  });

  test('rejects when the login cannot be resolved to a user id', async () => {
    service.getUser.mockResolvedValue(makeUser('  '));

    await expect(
      executeModCommand({ type: 'ban', login: 'ghost' }, context),
    ).rejects.toThrow('No Twitch user found for login "ghost"');
    expect(service.banChatUser).not.toHaveBeenCalled();
  });

  test('propagates Helix failures to the caller', async () => {
    service.banChatUser.mockRejectedValue(new Error('403'));

    await expect(
      executeModCommand({ type: 'ban', login: 'zoil' }, context),
    ).rejects.toThrow('403');
  });
});
