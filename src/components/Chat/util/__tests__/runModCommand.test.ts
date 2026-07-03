import { toast } from 'sonner-native';

import { logger } from '@app/utils/logger';

import { executeModCommand } from '../executeModCommand';
import type { ModCommand } from '../modCommands';
import { runModCommand } from '../runModCommand';

jest.mock('../executeModCommand', () => ({
  executeModCommand: jest.fn(),
}));

jest.mock('@app/utils/logger', () => ({
  logger: {
    chat: {
      warn: jest.fn(),
    },
  },
}));

const mockExecuteModCommand = jest.mocked(executeModCommand);
const mockToast = jest.mocked(toast);
const mockWarn = jest.mocked(logger.chat.warn);

const command: ModCommand = { type: 'ban', login: 'zoil', reason: 'spam' };

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('runModCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows a failure toast without executing when no moderator id is available', () => {
    runModCommand(command, 'channel-1', undefined);
    runModCommand(command, 'channel-1', '   ');

    expect(mockExecuteModCommand).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledTimes(2);
    expect(mockToast.error).toHaveBeenCalledWith('Moderation action failed');
  });

  test('executes the command and shows the success message as a toast', async () => {
    mockExecuteModCommand.mockResolvedValue('Banned zoil');

    runModCommand(command, 'channel-1', 'mod-1');
    await flushMicrotasks();

    expect(mockExecuteModCommand).toHaveBeenCalledWith(command, {
      broadcasterId: 'channel-1',
      moderatorId: 'mod-1',
    });
    expect(mockToast.success).toHaveBeenCalledWith('Banned zoil');
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  test('logs and shows a failure toast when the command rejects', async () => {
    const error = new Error('helix 403');
    mockExecuteModCommand.mockRejectedValue(error);

    runModCommand(command, 'channel-1', 'mod-1');
    await flushMicrotasks();

    expect(mockWarn).toHaveBeenCalledWith('Mod command failed', {
      error,
      command: 'ban',
      channel_id: 'channel-1',
    });
    expect(mockToast.error).toHaveBeenCalledWith('Moderation action failed');
    expect(mockToast.success).not.toHaveBeenCalled();
  });
});
