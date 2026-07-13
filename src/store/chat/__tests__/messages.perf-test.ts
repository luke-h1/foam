import { measureFunction } from 'reassure';

import {
  addMessages,
  clearMessages,
  getMaxChatMessages,
} from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';

import {
  ingestBurstMessages,
  ingestSeedMessages,
} from '../__fixtures__/messages.perf.fixture';

jest.mock('@legendapp/state/persist', () => ({
  configureObservablePersistence: jest.fn(),
  persistObservable: jest.fn(),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: class MockMMKV {
    set = jest.fn();
    getString = jest.fn();
    getAllKeys = jest.fn(() => []);
    delete = jest.fn();
  },
  createMMKV: () => ({
    set: jest.fn(),
    getString: jest.fn(),
    getAllKeys: jest.fn(() => []),
    remove: jest.fn(),
  }),
}));

const MEASURE_OPTIONS = {
  runs: 5,
  warmupRuns: 1,
} as const;

describe('chat message ingest performance', () => {
  beforeEach(() => {
    clearMessages();
    chatStore$.currentChannelId.set('perf-channel');
    chatStore$.recentMessagesByChannel.set({});
  });

  afterEach(() => {
    clearMessages();
    chatStore$.currentChannelId.set(null);
    chatStore$.recentMessagesByChannel.set({});
  });

  test('flushes a raid burst into a near-full bounded window', async () => {
    const cap = getMaxChatMessages();
    expect(ingestSeedMessages.length).toBeLessThan(cap);

    await measureFunction(() => {
      clearMessages();
      addMessages(ingestSeedMessages);
      addMessages(ingestBurstMessages);
    }, MEASURE_OPTIONS);
  });
});
