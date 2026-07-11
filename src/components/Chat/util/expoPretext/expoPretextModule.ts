import type { InlineFlowItem, TextStyle } from './types';

type LayoutResult = {
  height: number;
  lineCount: number;
};

type PreparedInlineFlow = unknown;

type PreparedTextWithSegments = unknown;

interface ExpoPretextModule {
  prepareInlineFlow: (items: InlineFlowItem[]) => PreparedInlineFlow;
  measureInlineFlow: (
    prepared: PreparedInlineFlow,
    maxWidth: number,
    lineHeight: number,
  ) => LayoutResult;
  prepareWithSegments: (
    text: string,
    style: TextStyle,
  ) => PreparedTextWithSegments;
  measureNaturalWidth: (prepared: PreparedTextWithSegments) => number;
}

export const expoPretext = require('expo-pretext') as ExpoPretextModule;
