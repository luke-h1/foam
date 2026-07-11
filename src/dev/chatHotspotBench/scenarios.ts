// DEV-ONLY: on-device workloads matching the Reassure chat hotspot scenarios.
import {
  multiLayerPaint,
  paintedUsernames,
  paintImageLayerLayout,
} from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/__tests__/__fixtures__/paint.perf.fixture';
import { buildPaintCssDeclarations } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintCss/buildPaintCssDeclarations';
import { paintCssDeclarationsToBlock } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintCss/paintCssDeclarationsToBlock';
import { buildPaintedUsernameHtml } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintHtml';
import { buildPaintImageLayers } from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/skiaPaintedUsernameRasterizer';
import { chatLineMetrics } from '@app/components/Chat/components/ChatMessage/RichChatMessage.styles';
import {
  denseEmoteData,
  reprocessChatLines,
} from '@app/components/Chat/util/__tests__/__fixtures__/resolveMessageEmoteParts.perf.fixture';
import { resolveMessageEmoteParts } from '@app/components/Chat/util/resolveMessageEmoteParts';
import {
  ingestBurstMessages,
  ingestSeedMessages,
} from '@app/store/chat/__tests__/__fixtures__/messages.perf.fixture';
import {
  addMessages,
  clearMessages,
} from '@app/store/chat/actions/messages';
import { chatStore$ } from '@app/store/chat/observables/chatStore';
import { createUserStateTags } from '@app/types/chat/irc-tags/__fixtures__/userStateTags.fixture';
import {
  badgeLookupUserstates,
  denseBadgeSources,
} from '@app/utils/chat/__tests__/__fixtures__/findBadges.perf.fixture';
import { findBadges } from '@app/utils/chat/findBadges';

import { measureSync, type SyncMeasureResult } from './measureSync';

export interface ChatHotspotScenario {
  id: string;
  name: string;
  /**
   * Optional one-shot setup before warmup (e.g. build WeakMap indexes).
   */
  setup?: () => void;
  run: () => void;
}

export interface ChatHotspotResult extends SyncMeasureResult {
  id: string;
  name: string;
}

function runMessageIngestBurst(): void {
  clearMessages();
  addMessages(ingestSeedMessages);
  addMessages(ingestBurstMessages);
}

function runFindBadgesDense(): void {
  for (const userstate of badgeLookupUserstates) {
    findBadges({
      ...denseBadgeSources,
      userstate,
    });
  }
}

function runResolveMessageEmotePartsBatch(): void {
  for (const line of reprocessChatLines) {
    resolveMessageEmoteParts({
      channelId: 'perf-channel',
      emoteData: denseEmoteData,
      show7TvEmotes: true,
      text: line.text,
      userId: line.userId,
      userLogin: 'luke',
      userstate: createUserStateTags({
        username: line.login,
        login: line.login,
        'user-id': line.userId,
        'display-name': line.login,
      }),
    });
  }
}

function runPaintHtmlBatch(): void {
  for (const username of paintedUsernames) {
    buildPaintedUsernameHtml({
      displayUsername: `${username}: `,
      paint: multiLayerPaint,
      fallbackColor: '#9146FF',
      fontSize: chatLineMetrics.comfortable.fontSize,
      lineHeight: chatLineMetrics.comfortable.lineHeight,
    });
  }
}

function runPaintCssBatch(): void {
  for (let i = 0; i < 80; i += 1) {
    paintCssDeclarationsToBlock(buildPaintCssDeclarations(multiLayerPaint));
  }
}

function runBuildPaintImageLayersBatch(): void {
  for (let i = 0; i < 200; i += 1) {
    buildPaintImageLayers(paintImageLayerLayout);
  }
}

/**
 * Same scenarios as the Reassure `*.perf-test.ts` files for ingest / badges /
 * emote reprocess / paint, so CI and on-device numbers describe the same work.
 */
export const CHAT_HOTSPOT_SCENARIOS: ChatHotspotScenario[] = [
  {
    id: 'message-ingest-burst',
    name: 'message ingest burst',
    setup: () => {
      chatStore$.currentChannelId.set('perf-channel');
      chatStore$.recentMessagesByChannel.set({});
      clearMessages();
    },
    run: runMessageIngestBurst,
  },
  {
    id: 'find-badges-dense',
    name: 'findBadges dense maps',
    setup: () => {
      findBadges({
        ...denseBadgeSources,
        userstate: badgeLookupUserstates[0]!,
      });
    },
    run: runFindBadgesDense,
  },
  {
    id: 'resolve-emote-parts',
    name: 'resolveMessageEmoteParts batch',
    run: runResolveMessageEmotePartsBatch,
  },
  {
    id: 'paint-html',
    name: 'paintHtml multi-layer batch',
    run: runPaintHtmlBatch,
  },
  {
    id: 'paint-css',
    name: 'paintCss multi-layer batch',
    run: runPaintCssBatch,
  },
  {
    id: 'paint-image-layers',
    name: 'buildPaintImageLayers batch',
    run: runBuildPaintImageLayersBatch,
  },
];

const yieldToUi = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0);
  });

export async function runChatHotspotBenchmarks(options?: {
  onProgress?: (name: string) => void;
  runs?: number;
  warmupRuns?: number;
}): Promise<ChatHotspotResult[]> {
  const results: ChatHotspotResult[] = [];
  const measureOptions = {
    runs: options?.runs ?? 5,
    warmupRuns: options?.warmupRuns ?? 1,
  };

  for (const scenario of CHAT_HOTSPOT_SCENARIOS) {
    options?.onProgress?.(scenario.name);
    scenario.setup?.();
    const measured = measureSync(scenario.run, measureOptions);
    results.push({
      id: scenario.id,
      name: scenario.name,
      ...measured,
    });
    // eslint-disable-next-line react-doctor/async-await-in-loop -- yield between scenarios so the UI can paint progress
    await yieldToUi();
  }

  clearMessages();
  return results;
}
